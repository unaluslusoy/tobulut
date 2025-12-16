"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../../prisma/prisma.service");
const bcrypt = require("bcrypt");
const mail_service_1 = require("../mail/mail.service");
const whatsapp_service_1 = require("../notifications/whatsapp.service");
const otplib_1 = require("otplib");
const qrcode_1 = require("qrcode");
let AuthService = AuthService_1 = class AuthService {
    constructor(prisma, jwtService, mailService, whatsappService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.mailService = mailService;
        this.whatsappService = whatsappService;
        this.logger = new common_1.Logger(AuthService_1.name);
    }
    async login(email, pass) {
        this.logger.log(`Login attempt for email: ${email}`);
        if (!email || !pass) {
            throw new common_1.UnauthorizedException('Lütfen e-posta ve şifrenizi giriniz.');
        }
        const user = await this.prisma.user.findFirst({
            where: { email },
            include: { tenant: true }
        });
        if (!user) {
            this.logger.warn(`User not found for email: ${email}`);
            throw new common_1.UnauthorizedException('Kullanıcı bulunamadı');
        }
        this.logger.log(`User found: ${user.id}, Tenant: ${user.tenantId}`);
        const isMatch = await bcrypt.compare(pass, user.passwordHash);
        if (!isMatch) {
            throw new common_1.UnauthorizedException('Hatalı şifre');
        }
        if (user.tenant.status !== 'active') {
            throw new common_1.UnauthorizedException('Firma aboneliği aktif değil');
        }
        if (user.isTwoFactorEnabled) {
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
                role: user.role,
                tenantId: user.tenantId
            }
        };
    }
    async generate2FASecret(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('Kullanıcı bulunamadı');
        const secret = otplib_1.authenticator.generateSecret();
        const otpauthUrl = otplib_1.authenticator.keyuri(user.email, 'ToPlus', secret);
        await this.prisma.user.update({
            where: { id: userId },
            data: { twoFactorSecret: secret }
        });
        const qrCodeUrl = await (0, qrcode_1.toDataURL)(otpauthUrl);
        return { secret, qrCodeUrl };
    }
    async enable2FA(userId, code) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('Kullanıcı bulunamadı');
        if (!user.twoFactorSecret)
            throw new common_1.UnauthorizedException('2FA kurulumu başlatılmamış.');
        const isValid = otplib_1.authenticator.verify({ token: code, secret: user.twoFactorSecret });
        if (!isValid)
            throw new common_1.UnauthorizedException('Hatalı kod. Lütfen tekrar deneyin.');
        await this.prisma.user.update({
            where: { id: userId },
            data: { isTwoFactorEnabled: true }
        });
        return { message: '2FA başarıyla aktifleştirildi.' };
    }
    async verify2fa(userId, code) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { tenant: true }
        });
        if (!user)
            throw new common_1.UnauthorizedException('Kullanıcı bulunamadı');
        if (!user.isTwoFactorEnabled || !user.twoFactorSecret) {
            throw new common_1.UnauthorizedException('2FA aktif değil.');
        }
        const isValid = otplib_1.authenticator.verify({ token: code, secret: user.twoFactorSecret });
        if (!isValid) {
            throw new common_1.UnauthorizedException('Hatalı onay kodu.');
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
                role: user.role,
                tenantId: user.tenantId
            }
        };
    }
    async forgotPassword(email) {
        const user = await this.prisma.user.findFirst({
            where: { email }
        });
        if (!user) {
            throw new common_1.NotFoundException('Böyle bir kullanıcı bulunamadı.');
        }
        const payload = { sub: user.id, email: user.email, type: 'reset' };
        const token = await this.jwtService.signAsync(payload, { expiresIn: '15m' });
        await this.mailService.sendPasswordResetEmail(user.email, token);
        return { message: 'Parola sıfırlama bağlantısı gönderildi.' };
    }
    async resetPassword(token, newPassword) {
        try {
            const payload = await this.jwtService.verifyAsync(token);
            if (payload.type !== 'reset') {
                throw new common_1.UnauthorizedException('Geçersiz işlem.');
            }
            const user = await this.prisma.user.findUnique({
                where: { id: payload.sub }
            });
            if (!user) {
                throw new common_1.NotFoundException('Kullanıcı bulunamadı.');
            }
            const passwordHash = await bcrypt.hash(newPassword, 10);
            await this.prisma.user.update({
                where: { id: user.id },
                data: { passwordHash }
            });
            return { message: 'Şifreniz başarıyla güncellendi. Yeni şifrenizle giriş yapabilirsiniz.' };
        }
        catch (error) {
            throw new common_1.UnauthorizedException('Şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş.');
        }
    }
    async updateProfile(userId, dto) {
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                name: dto.name,
                email: dto.email,
                phoneNumber: dto.phone,
                bio: dto.bio
            }
        });
        return { message: 'Profil başarıyla güncellendi.' };
    }
    async changePassword(userId, oldPass, newPass) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('Kullanıcı bulunamadı');
        const isMatch = await bcrypt.compare(oldPass, user.passwordHash);
        if (!isMatch)
            throw new common_1.UnauthorizedException('Mevcut şifreniz hatalı.');
        const passwordHash = await bcrypt.hash(newPass, 10);
        await this.prisma.user.update({
            where: { id: userId },
            data: { passwordHash }
        });
        return { message: 'Şifreniz başarıyla değiştirildi.' };
    }
    async initiateWhatsapp2FA(userId, phoneNumber) {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = new Date();
        expires.setMinutes(expires.getMinutes() + 5);
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                oneTimePassword: otp,
                twoFactorSecret: otp,
                twoFactorExpires: expires,
                phoneNumber: phoneNumber
            }
        });
        await this.whatsappService.sendOtp(phoneNumber, otp);
        return { message: 'WhatsApp doğrulama kodu gönderildi.' };
    }
    async verifyWhatsapp2FA(userId, code) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('Kullanıcı bulunamadı');
        if (user.twoFactorSecret !== code) {
            throw new common_1.UnauthorizedException('Hatalı doğrulama kodu.');
        }
        if (user.twoFactorExpires && new Date() > user.twoFactorExpires) {
            throw new common_1.UnauthorizedException('Doğrulama kodunun süresi dolmuş.');
        }
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                isTwoFactorEnabled: true,
                twoFactorMethod: 'whatsapp',
                twoFactorSecret: null,
                twoFactorExpires: null
            }
        });
        return { message: 'WhatsApp 2FA başarıyla aktifleştirildi.' };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        mail_service_1.MailService,
        whatsapp_service_1.WhatsappService])
], AuthService);
//# sourceMappingURL=auth.service.js.map