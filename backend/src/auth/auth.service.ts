import { Injectable, UnauthorizedException, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { db } from '@/database';
import { RegisterInput, LoginInput, OnboardingInput } from '@/validation';
import { RoleName, UserProfile } from '@/types';
import { MailService } from '@/mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private mailService: MailService,
  ) { }

  async sendVerificationCode(email: string) {
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      throw new BadRequestException('User with this email is already registered. Please sign in.');
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await db.verificationCode.upsert({
      where: { email },
      update: { code, expiresAt },
      create: { email, code, expiresAt },
    });

    // Send actual email via Nodemailer
    const sent = await this.mailService.sendVerificationEmail(email, code);
    if (!sent) {
      throw new InternalServerErrorException('Failed to send verification code email. Please verify the recipient address and try again.');
    }

    return {
      message: `Confirmation code sent to ${email}`,
      expiresAt,
    };
  }

  async register(input: RegisterInput) {
    const existing = await db.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw new BadRequestException('User with this email already exists');
    }

    // Require and verify confirmation code against database
    const record = await db.verificationCode.findUnique({ where: { email: input.email } });
    if (!record || record.code !== input.verificationCode || record.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired confirmation code. Please request a new confirmation code.');
    }

    // Clean up used code
    try {
      await db.verificationCode.delete({ where: { email: input.email } });
    } catch { }

    const hashedPassword = await argon2.hash(input.password);

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
        isEmailVerified: true,
        isOnboarded: false,
      },
    });

    if (assignedRole === RoleName.STUDENT) {
      await db.student.create({
        data: {
          userId: user.id,
          studentRegistrationNo: input.studentRegistrationNo || `STU-${Date.now()}`,
          gradeLevel: '1st Sem',
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

    const fullUser = await db.user.findUnique({
      where: { id: user.id },
      include: { student: true, teacher: true },
    });

    const tokens = await this.generateTokens(user.id, user.email, assignedRole);
    await this.createSession(user.id, tokens.refreshToken);

    return {
      user: this.formatUserProfile(fullUser!),
      tokens,
    };
  }

  async login(input: LoginInput) {
    const user = await db.user.findUnique({
      where: { email: input.email },
      include: { student: true, teacher: true },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await argon2.verify(user.passwordHash, input.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Email address is not verified. Please verify your email first.');
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

    if (user.role === RoleName.STUDENT) {
      const regNo = input.studentRegistrationNo?.trim() || user.studentRegistrationNo || user.student?.studentRegistrationNo || `STU-${Date.now().toString().slice(-6)}`;
      const grade = input.gradeLevel || user.student?.gradeLevel || '1st Sem';

      await db.user.update({
        where: { id: userId },
        data: {
          studentRegistrationNo: regNo,
          isOnboarded: true,
          ...(input.avatarUrl ? { avatarUrl: input.avatarUrl } : {}),
        },
      });

      if (user.student) {
        await db.student.update({
          where: { id: user.student.id },
          data: {
            gradeLevel: grade,
            studentRegistrationNo: regNo,
          },
        });
      } else {
        await db.student.create({
          data: {
            userId: user.id,
            studentRegistrationNo: regNo,
            gradeLevel: grade,
          },
        });
      }
    } else {
      await db.user.update({
        where: { id: userId },
        data: {
          isOnboarded: true,
          ...(input.avatarUrl ? { avatarUrl: input.avatarUrl } : {}),
        },
      });
    }

    if (user.role === RoleName.TEACHER) {
      const empId = input.employeeId?.trim() || user.teacher?.employeeId || `EMP-${Date.now().toString().slice(-6)}`;
      const dept = input.department || user.teacher?.department || 'Computer Science';

      if (user.teacher) {
        await db.teacher.update({
          where: { id: user.teacher.id },
          data: {
            department: dept,
            employeeId: empId,
          },
        });
      } else {
        await db.teacher.create({
          data: {
            userId: user.id,
            employeeId: empId,
            department: dept,
          },
        });
      }
    }

    const updatedUser = await db.user.findUnique({
      where: { id: userId },
      include: { student: true, teacher: true },
    });
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

      const user = await db.user.findUnique({
        where: { id: payload.sub },
        include: { student: true, teacher: true },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('User inactive or not found');
      }

      const tokens = await this.generateTokens(user.id, user.email, user.role);
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
      studentRegistrationNo: user.studentRegistrationNo || user.student?.studentRegistrationNo || null,
      gradeLevel: user.student?.gradeLevel || null,
      employeeId: user.teacher?.employeeId || null,
      department: user.teacher?.department || null,
      createdAt: user.createdAt?.toISOString ? user.createdAt.toISOString() : new Date().toISOString(),
    };
  }
}
