"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var WhatsappService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsappService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("axios");
let WhatsappService = WhatsappService_1 = class WhatsappService {
    constructor() {
        this.logger = new common_1.Logger(WhatsappService_1.name);
        this.provider = process.env.WHATSAPP_PROVIDER || 'console';
    }
    async sendOtp(phoneNumber, otp) {
        this.logger.log(`Attempting to send OTP ${otp} to ${phoneNumber} via ${this.provider}`);
        try {
            if (this.provider === 'twilio') {
                return await this.sendViaTwilio(phoneNumber, otp);
            }
            else if (this.provider === 'brevo') {
                return await this.sendViaBrevo(phoneNumber, otp);
            }
            else {
                this.logger.warn(`[DEV MODE] OTP for ${phoneNumber} is: ${otp}`);
                return true;
            }
        }
        catch (error) {
            this.logger.error(`Failed to send WhatsApp OTP: ${error.message}`);
            return false;
        }
    }
    async sendViaTwilio(to, code) {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const from = process.env.TWILIO_FROM;
        if (!accountSid || !authToken || !from) {
            throw new Error('Twilio credentials missing');
        }
        const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
        await axios_1.default.post(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, new URLSearchParams({
            From: from,
            To: formattedTo,
            Body: `ToBulut Güvenlik Kodunuz: ${code}`
        }).toString(), {
            headers: {
                'Authorization': `Basic ${Buffer.from(accountSid + ':' + authToken).toString('base64')}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        return true;
    }
    async sendViaBrevo(to, code) {
        const apiKey = process.env.BREVO_API_KEY;
        if (!apiKey)
            throw new Error('Brevo API Key missing');
        this.logger.warn(`Brevo WhatsApp implementation pending credentials. OTP: ${code}`);
        return true;
    }
};
exports.WhatsappService = WhatsappService;
exports.WhatsappService = WhatsappService = WhatsappService_1 = __decorate([
    (0, common_1.Injectable)()
], WhatsappService);
//# sourceMappingURL=whatsapp.service.js.map