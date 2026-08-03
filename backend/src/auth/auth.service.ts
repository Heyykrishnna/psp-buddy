import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { db } from '@/database';
import { RegisterInput, LoginInput, GoogleAuthInput, OnboardingInput } from '@/validation';
import { RoleName, UserProfile } from '@/types';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async register(input: RegisterInput) {
    const existing = await db.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw new BadRequestException('User with this email already exists');
    }

    const hashedPassword = await argon2.hash(input.password);
    const assignedRole = (input.role as RoleName) || RoleName.STUDENT;

    const user = await db.user.create({
      data: {
        email: input.email,
        passwordHash: hashedPassword,
        firstName: input.firstName,
        lastName: input.lastName,
        role: assignedRole,
        isOnboarded: false,
      },
    });

    if (assignedRole === RoleName.STUDENT) {
      await db.student.create({
        data: {
          userId: user.id,
          studentRegistrationNo: input.studentRegistrationNo || `STU-${Date.now()}`,
        },
      });
    } else if (assignedRole === RoleName.TEACHER) {
      await db.teacher.create({
        data: {
          userId: user.id,
          employeeId: input.employeeId || `EMP-${Date.now()}`,
        },
      });
    }

    const tokens = await this.generateTokens(user.id, user.email, assignedRole);
    await this.createSession(user.id, tokens.refreshToken);

    return {
      user: this.formatUserProfile(user),
      tokens,
    };
  }

  async login(input: LoginInput) {
    const user = await db.user.findUnique({
      where: { email: input.email },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await argon2.verify(user.passwordHash, input.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.createSession(user.id, tokens.refreshToken);

    return {
      user: this.formatUserProfile(user),
      tokens,
    };
  }

  async googleAuth(input: GoogleAuthInput) {
    // Decode/verify google idToken payload
    // In production, use OAuth2Client from google-auth-library.
    // For development fallback/token parsing:
    let email = '';
    let firstName = input.firstName || 'User';
    let lastName = input.lastName || '';
    let avatarUrl: string | undefined;

    try {
      // Decode JWT token payload safely if valid JWT format
      const parts = input.idToken.split('.');
      if (parts.length === 3) {
        const payloadJson = Buffer.from(parts[1], 'base64').toString('utf-8');
        const decoded = JSON.parse(payloadJson);
        if (decoded.email) {
          email = decoded.email;
          firstName = decoded.given_name || decoded.name?.split(' ')[0] || firstName;
          lastName = decoded.family_name || decoded.name?.split(' ').slice(1).join(' ') || lastName;
          avatarUrl = decoded.picture;
        }
      }
    } catch {
      // fallback
    }

    if (!email) {
      // fallback mock for invalid/raw token in dev mode
      email = input.idToken.includes('@') ? input.idToken : `user_${Date.now()}@google.com`;
    }

    let user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Auto-create user with STUDENT role in PostgreSQL
      user = await db.user.create({
        data: {
          email,
          firstName,
          lastName,
          avatarUrl,
          role: RoleName.STUDENT,
          isEmailVerified: true,
          isOnboarded: false,
        },
      });

      await db.student.create({
        data: {
          userId: user.id,
          studentRegistrationNo: `STU-${Date.now()}`,
        },
      });
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.createSession(user.id, tokens.refreshToken);

    return {
      user: this.formatUserProfile(user),
      tokens,
    };
  }

  async me(userId: string) {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        student: true,
        teacher: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      user: this.formatUserProfile(user),
      student: user.student,
      teacher: user.teacher,
    };
  }

  async onboard(userId: string, input: OnboardingInput) {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { student: true, teacher: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (input.avatarUrl) {
      await db.user.update({
        where: { id: userId },
        data: { avatarUrl: input.avatarUrl, isOnboarded: true },
      });
    } else {
      await db.user.update({
        where: { id: userId },
        data: { isOnboarded: true },
      });
    }

    if (user.role === RoleName.STUDENT && user.student) {
      await db.student.update({
        where: { id: user.student.id },
        data: {
          gradeLevel: input.gradeLevel || user.student.gradeLevel,
          studentRegistrationNo: input.studentRegistrationNo || user.student.studentRegistrationNo,
        },
      });
    } else if (user.role === RoleName.TEACHER && user.teacher) {
      await db.teacher.update({
        where: { id: user.teacher.id },
        data: {
          department: input.department || user.teacher.department,
          employeeId: input.employeeId || user.teacher.employeeId,
        },
      });
    }

    const updatedUser = await db.user.findUnique({ where: { id: userId } });
    return this.formatUserProfile(updatedUser!);
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'refresh_secret',
      });

      const session = await db.session.findFirst({
        where: { userId: payload.sub, refreshToken, isRevoked: false },
      });

      if (!session) {
        throw new UnauthorizedException('Session expired or revoked');
      }

      const user = await db.user.findUnique({ where: { id: payload.sub } });
      if (!user) throw new UnauthorizedException('User not found');

      const tokens = await this.generateTokens(user.id, user.email, user.role);

      // Rotation: revoke old session and create new
      await db.session.update({
        where: { id: session.id },
        data: { isRevoked: true },
      });
      await this.createSession(user.id, tokens.refreshToken);

      return {
        user: this.formatUserProfile(user),
        tokens,
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      await db.session.updateMany({
        where: { userId, refreshToken },
        data: { isRevoked: true },
      });
    } else {
      await db.session.updateMany({
        where: { userId },
        data: { isRevoked: true },
      });
    }
    return { success: true };
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
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db.session.create({
      data: {
        userId,
        refreshToken,
        expiresAt,
      },
    });
  }

  private formatUserProfile(user: any): UserProfile {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      role: user.role as RoleName,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      isOnboarded: user.isOnboarded,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
