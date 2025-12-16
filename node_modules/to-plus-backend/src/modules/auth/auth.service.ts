
import { Injectable, UnauthorizedException, NotFoundException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { MailService } from '../mail/mail.service';
import { WhatsappService } from '../notifications/whatsapp.service';
import * as crypto from 'crypto';
import { authenticator } from 'otplib';
import { toDataURL } from 'qrcode';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
    private whatsappService: WhatsappService,
  ) {}

  async login(email: string, pass: string) {
    this.logger.log(`Login attempt for email: ${email}`);

    if (!email || !pass) {
        throw new UnauthorizedException('Lütfen e-posta ve şifrenizi giriniz.');
    }
    
    // Kullanıcıyı bul
    const user = await (this.prisma as any).user.findFirst({
      where: { email },
      include: { tenant: true }
    });

    if (!user) {
      this.logger.warn(`User not found for email: ${email}`);
      throw new UnauthorizedException('Kullanıcı bulunamadı');
    }
    
    this.logger.log(`User found: ${user.id}, Tenant: ${user.tenantId}`);

    // Şifre kontrolü (Bcrypt ile)
    const isMatch = await bcrypt.compare(pass, user.passwordHash);

    if (!isMatch) {
      throw new UnauthorizedException('Hatalı şifre');
    }

    if (user.tenant.status !== 'active') {
        throw new UnauthorizedException('Firma aboneliği aktif değil');
    }

    // --- 2FA Check (TOTP) ---
    if ((user as any).isTwoFactorEnabled) {
        // Return special response without generating new OTP (Authenticator handles it)
        return {
            status: '2fa_required',
            userId: user.id,
            message: 'Lütfen Authenticator uygulamanızdaki kodu giriniz.'
        };
    }

    const payload = { 
        sub: user.id, 
        email: user.email, 
        role: user.role,
        tenantId: user.tenantId,
        tenantName: user.tenant.name
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
          id: user.id,
          userNo: user.userNo,
          name: user.name,
          email: user.email, 
          phoneNumber: user.phoneNumber,
          bio: user.bio,
          // avatar: user.avatar, // Ensure schema has this if we return it, or add to query if it's a relation (it's not, it matches schema)
          role: user.role,
          tenantId: user.tenantId
      }
    };
  }

  // --- TOTP Setup Methods ---

  async generate2FASecret(userId: string) {
      const user = await (this.prisma as any).user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundException('Kullanıcı bulunamadı');

      // Generate new secret
      const secret = authenticator.generateSecret();
      const otpauthUrl = authenticator.keyuri(user.email, 'ToPlus', secret);

      // Save secret temporarily (or overwrite existing pending setup)
      await (this.prisma as any).user.update({
          where: { id: userId },
          data: { twoFactorSecret: secret } // Note: keeping isTwoFactorEnabled = false until confirmed
      });

      // Generate QR Code Data URL
      const qrCodeUrl = await toDataURL(otpauthUrl);

      return { secret, qrCodeUrl };
  }

  async enable2FA(userId: string, code: string) {
      const user = await (this.prisma as any).user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundException('Kullanıcı bulunamadı');
      if (!user.twoFactorSecret) throw new UnauthorizedException('2FA kurulumu başlatılmamış.');

      // Verify token
      const isValid = authenticator.verify({ token: code, secret: user.twoFactorSecret });
      if (!isValid) throw new UnauthorizedException('Hatalı kod. Lütfen tekrar deneyin.');

      // Enable 2FA
      await (this.prisma as any).user.update({
          where: { id: userId },
          data: { isTwoFactorEnabled: true }
      });

      return { message: '2FA başarıyla aktifleştirildi.' };
  }

  async verify2fa(userId: string, code: string) {
      const user = await (this.prisma as any).user.findUnique({
          where: { id: userId },
          include: { tenant: true }
      });

      if (!user) throw new UnauthorizedException('Kullanıcı bulunamadı');

      if (!user.isTwoFactorEnabled || !user.twoFactorSecret) {
          throw new UnauthorizedException('2FA aktif değil.');
      }

      // Verify against Authenticator Secret
      const isValid = authenticator.verify({ token: code, secret: user.twoFactorSecret });

      if (!isValid) {
           throw new UnauthorizedException('Hatalı onay kodu.');
      }

      // Issue Token
      const payload = { 
        sub: user.id, 
        email: user.email, 
        role: user.role,
        tenantId: user.tenantId,
        tenantName: user.tenant.name
      };

      return {
        access_token: await this.jwtService.signAsync(payload),
        user: {
            id: user.id,
            userNo: user.userNo,
            name: user.name,
            email: user.email,
            phoneNumber: user.phoneNumber,
            bio: user.bio,
            role: user.role,
            tenantId: user.tenantId
        }
      };
  }

  async forgotPassword(email: string) {
    const user = await (this.prisma as any).user.findFirst({
        where: { email }
    });

    if (!user) {
        throw new NotFoundException('Böyle bir kullanıcı bulunamadı.');
    }

    // Generate specific reset token (short lived)
    const payload = { sub: user.id, email: user.email, type: 'reset' };
    const token = await this.jwtService.signAsync(payload, { expiresIn: '15m' });

    // Send Email
    await this.mailService.sendPasswordResetEmail(user.email, token);

    return { message: 'Parola sıfırlama bağlantısı gönderildi.' };
  }
  async resetPassword(token: string, newPassword: string) {
    try {
        const payload = await this.jwtService.verifyAsync(token);
        
        if (payload.type !== 'reset') {
            throw new UnauthorizedException('Geçersiz işlem.');
        }

        const user = await (this.prisma as any).user.findUnique({
            where: { id: payload.sub }
        });

        if (!user) {
            throw new NotFoundException('Kullanıcı bulunamadı.');
        }

        const passwordHash = await bcrypt.hash(newPassword, 10);

        await (this.prisma as any).user.update({
            where: { id: user.id },
            data: { passwordHash }
        });

        return { message: 'Şifreniz başarıyla güncellendi. Yeni şifrenizle giriş yapabilirsiniz.' };

    } catch (error) {
        throw new UnauthorizedException('Şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş.');
    }
  }

  async updateProfile(userId: string, dto: { name?: string; email?: string; avatar?: string; phone?: string; bio?: string }) {
      await (this.prisma as any).user.update({
          where: { id: userId },
          data: {
              name: dto.name,
              email: dto.email,
              phoneNumber: dto.phone,
              bio: dto.bio
              // Avatar usually handled via file upload service
          }
      });
      return { message: 'Profil başarıyla güncellendi.' };
  }

  async changePassword(userId: string, oldPass: string, newPass: string) {
      const user = await (this.prisma as any).user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundException('Kullanıcı bulunamadı');

      const isMatch = await bcrypt.compare(oldPass, user.passwordHash);
      if (!isMatch) throw new UnauthorizedException('Mevcut şifreniz hatalı.');

      const passwordHash = await bcrypt.hash(newPass, 10);
      await (this.prisma as any).user.update({
          where: { id: userId },
          data: { passwordHash }
      });

      return { message: 'Şifreniz başarıyla değiştirildi.' };
  }

  async initiateWhatsapp2FA(userId: string, phoneNumber: string) {
      // Generate numeric OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Calculate expiration (e.g., 5 mins)
      const expires = new Date();
      expires.setMinutes(expires.getMinutes() + 5);

      await (this.prisma as any).user.update({
          where: { id: userId },
          data: {
              oneTimePassword: otp, // Needs to be added to schema if not present? 
              // Wait, previous 2FA used 'twoFactorSecret' for TOTP. For WhatsApp, we need generic OTP support.
              // Schema has `twoFactorSecret`. We could reuse it or add `phoneOtp`.
              // Let's use `twoFactorSecret` for now as "OTP" since WhatsApp is stateless here.
              twoFactorSecret: otp, 
              twoFactorExpires: expires,
              phoneNumber: phoneNumber 
          }
      });

      // Send via WhatsApp Service
      await this.whatsappService.sendOtp(phoneNumber, otp);

      return { message: 'WhatsApp doğrulama kodu gönderildi.' };
  }

  async verifyWhatsapp2FA(userId: string, code: string) {
      const user = await (this.prisma as any).user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundException('Kullanıcı bulunamadı');

      if (user.twoFactorSecret !== code) {
           throw new UnauthorizedException('Hatalı doğrulama kodu.');
      }

      if (user.twoFactorExpires && new Date() > user.twoFactorExpires) {
          throw new UnauthorizedException('Doğrulama kodunun süresi dolmuş.');
      }

      // Enable 2FA
      await (this.prisma as any).user.update({
          where: { id: userId },
          data: {
              isTwoFactorEnabled: true,
              twoFactorMethod: 'whatsapp',
              twoFactorSecret: null, // Clear OTP after usage
              twoFactorExpires: null
          }
      });

      return { message: 'WhatsApp 2FA başarıyla aktifleştirildi.' };
  }
}
