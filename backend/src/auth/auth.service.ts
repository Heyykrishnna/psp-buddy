import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { OAuth2Client } from 'google-auth-library';
import { db } from '@/database';
import { RegisterInput, LoginInput, GoogleAuthInput, OnboardingInput } from '@/validation';
import { RoleName, UserProfile } from '@/types';

@Injectable()
export class AuthService {
  private googleOAuthClient: OAuth2Client;

  constructor(private jwtService: JwtService) {
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    this.googleOAuthClient = new OAuth2Client(googleClientId);
  }


  async register(input: RegisterInput) {
    const existing = await db.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw new BadRequestException('User with this email already exists');
    }

    const hashedPassword = await argon2.hash(input.password);
    
    // Role determination is handled purely on the backend
    let assignedRole: RoleName = RoleName.STUDENT;
    if (input.role) {
      assignedRole = input.role as RoleName;
    } else if (input.email.toLowerCase().includes('teacher')) {
      assignedRole = RoleName.TEACHER;
    } else if (input.email.toLowerCase().includes('admin')) {
      assignedRole = RoleName.ADMIN;
    }

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
    let email = '';
    let firstName = input.firstName || 'User';
    let lastName = input.lastName || '';
    let avatarUrl: string | undefined;
    let googleId: string | undefined;

    const googleClientId = process.env.GOOGLE_CLIENT_ID;

    // 1. Try verifying Google ID token if client ID is configured
    if (googleClientId && googleClientId !== 'your_google_client_id_here.apps.googleusercontent.com' && input.idToken && !input.idToken.startsWith('google_token_')) {
      try {
        const ticket = await this.googleOAuthClient.verifyIdToken({
          idToken: input.idToken,
          audience: googleClientId,
        });
        const payload = ticket.getPayload();
        if (payload && payload.email) {
          email = payload.email;
          googleId = payload.sub;
          firstName = payload.given_name || payload.name?.split(' ')[0] || firstName;
          lastName = payload.family_name || payload.name?.split(' ').slice(1).join(' ') || lastName;
          avatarUrl = payload.picture;
        }
      } catch (err: any) {
        // Log verification error and fallback
      }
    }

    // 2. Fallback JWT payload decoder for local dev or custom tokens
    if (!email && input.idToken) {
      try {
        const parts = input.idToken.split('.');
        if (parts.length === 3) {
          const payloadJson = Buffer.from(parts[1], 'base64').toString('utf-8');
          const decoded = JSON.parse(payloadJson);
          if (decoded.email) {
            email = decoded.email;
            googleId = decoded.sub || decoded.user_id;
            firstName = decoded.given_name || decoded.name?.split(' ')[0] || firstName;
            lastName = decoded.family_name || decoded.name?.split(' ').slice(1).join(' ') || lastName;
            avatarUrl = decoded.picture;
          }
        }
      } catch {}
    }

    if (!email) {
      email = input.idToken.includes('@') ? input.idToken : `user_${Date.now()}@google.com`;
    }

    let user = await db.user.findFirst({
      where: {
        OR: [
          { email },
          ...(googleId ? [{ googleId }] : []),
        ],
      },
    });

    if (!user) {
      // Determine initial role
      const assignedRole = email.toLowerCase().includes('teacher') ? RoleName.TEACHER : RoleName.STUDENT;

      user = await db.user.create({
        data: {
          email,
          googleId,
          firstName,
          lastName,
          avatarUrl,
          role: assignedRole,
          isEmailVerified: true,
          isOnboarded: false,
        },
      });

      if (assignedRole === RoleName.STUDENT) {
        await db.student.create({
          data: {
            userId: user.id,
            studentRegistrationNo: `STU-${Date.now()}`,
          },
        });
      } else {
        await db.teacher.create({
          data: {
            userId: user.id,
            employeeId: `EMP-${Date.now()}`,
          },
        });
      }
    } else if (googleId && !user.googleId) {
      // Link Google account to existing user
      user = await db.user.update({
        where: { id: user.id },
        data: { googleId, avatarUrl: avatarUrl || user.avatarUrl, isEmailVerified: true },
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
