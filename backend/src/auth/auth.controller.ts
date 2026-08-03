import { Controller, Post, Get, Body, HttpCode, HttpStatus, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import {
  RegisterInput,
  LoginInput,
  RefreshTokenInput,
  OnboardingInput,
  SendVerificationCodeInput,
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  onboardingSchema,
  sendVerificationCodeSchema,
} from '@/validation';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('send-verification-code')
  @HttpCode(HttpStatus.OK)
  async sendVerificationCode(@Body() body: any) {
    const validated = sendVerificationCodeSchema.parse(body);
    return this.authService.sendVerificationCode(validated.email);
  }

  @Post('register')
  async register(@Body() body: any) {
    const validated = registerSchema.parse(body);
    return this.authService.register(validated);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: any) {
    const validated = loginSchema.parse(body);
    return this.authService.login(validated);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Request() req: any) {
    return this.authService.me(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('onboarding')
  @HttpCode(HttpStatus.OK)
  async onboard(@Request() req: any, @Body() body: any) {
    const validated = onboardingSchema.parse(body);
    return this.authService.onboard(req.user.id, validated);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() body: any) {
    const validated = refreshTokenSchema.parse(body);
    return this.authService.refresh(validated.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req: any, @Body() body: any) {
    return this.authService.logout(req.user.id, body?.refreshToken);
  }
}
