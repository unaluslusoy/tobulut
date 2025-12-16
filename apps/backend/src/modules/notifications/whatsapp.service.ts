
import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly provider = process.env.WHATSAPP_PROVIDER || 'console'; // 'twilio', 'brevo', or 'console'

  async sendOtp(phoneNumber: string, otp: string): Promise<boolean> {
    this.logger.log(`Attempting to send OTP ${otp} to ${phoneNumber} via ${this.provider}`);

    try {
        if (this.provider === 'twilio') {
             return await this.sendViaTwilio(phoneNumber, otp);
        } else if (this.provider === 'brevo') {
             return await this.sendViaBrevo(phoneNumber, otp);
        } else {
             // Development Mode
             this.logger.warn(`[DEV MODE] OTP for ${phoneNumber} is: ${otp}`);
             return true;
        }
    } catch (error) {
        this.logger.error(`Failed to send WhatsApp OTP: ${error.message}`);
        return false;
    }
  }

  private async sendViaTwilio(to: string, code: string): Promise<boolean> {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const from = process.env.TWILIO_FROM; // e.g. 'whatsapp:+14155238886'

      if (!accountSid || !authToken || !from) {
          throw new Error('Twilio credentials missing');
      }

      // Format phone number to E.164 if needed, strictly for WhatsApp it needs 'whatsapp:' prefix usually
      const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

      await axios.post(
          `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
          new URLSearchParams({
              From: from,
              To: formattedTo,
              Body: `ToBulut Güvenlik Kodunuz: ${code}`
          }).toString(),
          {
              headers: {
                  'Authorization': `Basic ${Buffer.from(accountSid + ':' + authToken).toString('base64')}`,
                  'Content-Type': 'application/x-www-form-urlencoded'
              }
          }
      );
      return true;
  }

  private async sendViaBrevo(to: string, code: string): Promise<boolean> {
     const apiKey = process.env.BREVO_API_KEY;
     // Note: Brevo WhatsApp API requires templates usually, but for simple tests or if allowed:
     // Start with console log if API is not fully set up
     if (!apiKey) throw new Error('Brevo API Key missing');
     
     // Placeholder for Brevo Logic (requires Sender Number setup)
     // For now, logging it as we don't have the specific sender ID from user
     this.logger.warn(`Brevo WhatsApp implementation pending credentials. OTP: ${code}`);
     return true;
  }
}
