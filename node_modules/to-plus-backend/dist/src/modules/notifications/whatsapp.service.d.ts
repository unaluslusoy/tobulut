export declare class WhatsappService {
    private readonly logger;
    private readonly provider;
    sendOtp(phoneNumber: string, otp: string): Promise<boolean>;
    private sendViaTwilio;
    private sendViaBrevo;
}
