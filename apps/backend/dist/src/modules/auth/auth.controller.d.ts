import { AuthService } from './auth.service';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    signIn(signInDto: Record<string, any>): Promise<{
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
    forgotPassword(body: {
        email: string;
    }): Promise<{
        message: string;
    }>;
    resetPassword(body: {
        token: string;
        password: string;
    }): Promise<{
        message: string;
    }>;
    verify2fa(body: {
        userId: string;
        code: string;
    }): Promise<{
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
    generate2fa(body: {
        userId: string;
    }): Promise<{
        secret: string;
        qrCodeUrl: string;
    }>;
    enable2fa(body: {
        userId: string;
        code: string;
    }): Promise<{
        message: string;
    }>;
    updateProfile(body: any): Promise<{
        message: string;
    }>;
    changePassword(body: any): Promise<{
        message: string;
    }>;
    initiateWhatsapp2FA(body: {
        userId: string;
        phone: string;
    }): Promise<{
        message: string;
    }>;
    verifyWhatsapp2FA(body: {
        userId: string;
        code: string;
    }): Promise<{
        message: string;
    }>;
}
