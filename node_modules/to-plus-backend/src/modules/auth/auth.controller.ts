
import { Body, Controller, Post, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ThrottlerGuard } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  signIn(@Body() signInDto: Record<string, any>) {
    return this.authService.login(signInDto.email, signInDto.password);
  }
  @UseGuards(ThrottlerGuard)
  @Post('forgot-password')
  forgotPassword(@Body() body: { email: string }) {
    return this.authService.forgotPassword(body.email);
  }

  @Post('reset-password')
  resetPassword(@Body() body: { token: string; password: string }) {
    return this.authService.resetPassword(body.token, body.password);
  }

  @Post('verify-2fa')
  verify2fa(@Body() body: { userId: string; code: string }) {
    return this.authService.verify2fa(body.userId, body.code);
  }

  @Post('generate-2fa')
  generate2fa(@Body() body: { userId: string }) {
    return this.authService.generate2FASecret(body.userId);
  }

  @Post('enable-2fa')
  enable2fa(@Body() body: { userId: string; code: string }) {
    return this.authService.enable2FA(body.userId, body.code);
  }

  @Post('update-profile')
  updateProfile(@Body() body: any) {
    return this.authService.updateProfile(body.id, body);
  }

  @Post('change-password')
  changePassword(@Body() body: any) {
    return this.authService.changePassword(body.userId, body.current, body.new);
  }

  @Post('initiate-whatsapp-2fa')
  initiateWhatsapp2FA(@Body() body: { userId: string; phone: string }) {
    return this.authService.initiateWhatsapp2FA(body.userId, body.phone);
  }

  @Post('verify-whatsapp-2fa')
  verifyWhatsapp2FA(@Body() body: { userId: string; code: string }) {
    return this.authService.verifyWhatsapp2FA(body.userId, body.code);
  }
}
