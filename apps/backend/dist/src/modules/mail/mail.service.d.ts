export declare class MailService {
    private transporter;
    private readonly logger;
    constructor();
    sendPasswordResetEmail(email: string, token: string): Promise<boolean>;
}
