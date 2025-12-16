
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants';
import { MailModule } from '../mail/mail.module';
import { WhatsappService } from '../notifications/whatsapp.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'secret',
      signOptions: { expiresIn: '1d' },
    }),
    MailModule // MailModule eklendi (MailService için)
  ],
  controllers: [AuthController],
  providers: [AuthService, PrismaService, WhatsappService, JwtStrategy],
  exports: [AuthService, WhatsappService], // WhatsappService export edildi
})
export class AuthModule {}
