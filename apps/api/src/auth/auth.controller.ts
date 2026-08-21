import { Body, Controller, Get, Headers, HttpCode, Post, UseGuards } from '@nestjs/common';
import { OtpRequestSchema, OtpVerifySchema, TelegramAuthSchema } from '@rieltor/shared';
import { AuthService } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import { JwtGuard } from './jwt.guard';
import { TokenService } from './token.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly tokens: TokenService,
  ) {}

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

  @Get('me')
  @UseGuards(JwtGuard)
  me(@CurrentUser() user: { id: string }) {
    return this.auth.findById(user.id);
  }

  @Post('refresh')
  refresh(@Body() body: { refreshToken: string }, @Headers('user-agent') userAgent?: string) {
    return this.tokens.rotate(body.refreshToken, userAgent);
  }

  @Post('logout')
  @HttpCode(204)
  async logout(@Body() body: { refreshToken: string }) {
    await this.tokens.revoke(body.refreshToken);
  }
}
