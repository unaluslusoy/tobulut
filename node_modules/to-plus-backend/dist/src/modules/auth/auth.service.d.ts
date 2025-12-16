import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { WhatsappService } from '../notifications/whatsapp.service';
export declare class AuthService {
    private prisma;
    private jwtService;
    private mailService;
    private whatsappService;
    private readonly logger;
    constructor(prisma: PrismaService, jwtService: JwtService, mailService: MailService, whatsappService: WhatsappService);
    login(email: string, pass: string): Promise<{
        status: string;
        userId: any;
        message: string;
        access_token?: undefined;
        user?: undefined;
    } | {
        access_token: string;
        user: {
            id: any;
            userNo: any;
            name: any;
            email: any;
            phoneNumber: any;
            bio: any;
            role: any;
            tenantId: any;
        };
        status?: undefined;
        userId?: undefined;
        message?: undefined;
    }>;
    generate2FASecret(userId: string): Promise<{
        secret: string;
        qrCodeUrl: string;
    }>;
    enable2FA(userId: string, code: string): Promise<{
        message: string;
    }>;
    verify2fa(userId: string, code: string): Promise<{
        access_token: string;
        user: {
            id: any;
            userNo: any;
            name: any;
            email: any;
            phoneNumber: any;
            bio: any;
            role: any;
            tenantId: any;
        };
    }>;
    forgotPassword(email: string): Promise<{
        message: string;
    }>;
    resetPassword(token: string, newPassword: string): Promise<{
        message: string;
    }>;
    updateProfile(userId: string, dto: {
        name?: string;
        email?: string;
        avatar?: string;
        phone?: string;
        bio?: string;
    }): Promise<{
        message: string;
    }>;
    changePassword(userId: string, oldPass: string, newPass: string): Promise<{
        message: string;
    }>;
    initiateWhatsapp2FA(userId: string, phoneNumber: string): Promise<{
        message: string;
    }>;
    verifyWhatsapp2FA(userId: string, code: string): Promise<{
        message: string;
    }>;
}
