import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { db } from '@/database';
import { RegisterInput, LoginInput } from '@/validation';
import { RoleName } from '@/types';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async register(input: RegisterInput) {
    const existing = await db.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw new BadRequestException('User with this email already exists');
    }

    const hashedPassword = await argon2.hash(input.password);

    // Get or create Role
    let role = await db.role.findUnique({ where: { name: input.role as RoleName } });
    if (!role) {
      role = await db.role.create({
        data: { name: input.role as RoleName, description: `${input.role} role` },
      });
    }

    const user = await db.user.create({
      data: {
        email: input.email,
        passwordHash: hashedPassword,
        firstName: input.firstName,
        lastName: input.lastName,
        roleId: role.id,
      },
    });

    if (input.role === 'STUDENT') {
      await db.student.create({
        data: {
          userId: user.id,
          studentRegistrationNo: input.studentRegistrationNo || `STU-${Date.now()}`,
        },
      });
    } else if (input.role === 'TEACHER') {
      await db.teacher.create({
        data: {
          userId: user.id,
          employeeId: input.employeeId || `EMP-${Date.now()}`,
        },
      });
    }

    const tokens = await this.generateTokens(user.id, user.email, input.role);
    await this.createSession(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: input.role as RoleName,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt.toISOString(),
      },
      tokens,
    };
  }

  async login(input: LoginInput) {
    const user = await db.user.findUnique({
      where: { email: input.email },
      include: { role: true },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await argon2.verify(user.passwordHash, input.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role.name);
    await this.createSession(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role.name,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt.toISOString(),
      },
      tokens,
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, { secret: process.env.JWT_REFRESH_SECRET || 'refresh_secret' });
      const refreshTokenHash = await argon2.hash(refreshToken);

      const session = await db.session.findFirst({
        where: { userId: payload.sub, isRevoked: false },
      });

      if (!session) {
        throw new UnauthorizedException('Session expired or revoked');
      }

      const user = await db.user.findUnique({
        where: { id: payload.sub },
        include: { role: true },
      });

      if (!user) throw new UnauthorizedException('User not found');

      return this.generateTokens(user.id, user.email, user.role.name);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET || 'access_secret',
      expiresIn: '15m',
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'refresh_secret',
      expiresIn: '7d',
    });

    return { accessToken, refreshToken, expiresIn: 900 };
  }

  private async createSession(userId: string, refreshToken: string) {
    const refreshTokenHash = await argon2.hash(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await db.session.create({
      data: {
        userId,
        refreshTokenHash,
        expiresAt,
      },
    });
  }
}
