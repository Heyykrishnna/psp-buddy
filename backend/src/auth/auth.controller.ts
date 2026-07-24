import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterInput, LoginInput, RefreshTokenInput, registerSchema, loginSchema, refreshTokenSchema } from '@/validation';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() body: any) {
    const validated = refreshTokenSchema.parse(body);
    return this.authService.refresh(validated.refreshToken);
  }
}
