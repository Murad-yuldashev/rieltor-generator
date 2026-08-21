import { Body, Controller, Headers, Post } from '@nestjs/common';
import { OtpRequestSchema, OtpVerifySchema, TelegramAuthSchema } from '@rieltor/shared';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('otp/request')
  requestOtp(@Body() body: unknown) {
    const { phone } = OtpRequestSchema.parse(body);
    return this.auth.requestOtp(phone);
  }

  @Post('otp/verify')
  verifyOtp(@Body() body: unknown, @Headers('user-agent') userAgent?: string) {
    const { phone, code } = OtpVerifySchema.parse(body);
    return this.auth.verifyOtp(phone, code, userAgent);
  }

  @Post('telegram')
  loginWithTelegram(@Body() body: unknown, @Headers('user-agent') userAgent?: string) {
    const payload = TelegramAuthSchema.parse(body);
    return this.auth.loginWithTelegram(payload, userAgent);
  }
}
