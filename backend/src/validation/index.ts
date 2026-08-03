import { z } from 'zod';

export const sendVerificationCodeSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export type SendVerificationCodeInput = z.infer<typeof sendVerificationCodeSchema>;

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['ADMIN', 'TEACHER', 'STUDENT']).optional().default('STUDENT'),
  verificationCode: z.string().min(4, 'Confirmation code is required'),
  studentRegistrationNo: z.string().optional(),
  employeeId: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;


export const onboardingSchema = z.object({
  gradeLevel: z.string().optional(),
  studentRegistrationNo: z.string().optional(),
  employeeId: z.string().optional(),
  department: z.string().optional(),
  avatarUrl: z.string().optional(),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

export const submitAnswerSchema = z.object({
  assessmentId: z.string().uuid(),
  questionId: z.string().uuid(),
  selectedOptionId: z.string().uuid().optional(),
  textAnswer: z.string().optional(),
});

export type SubmitAnswerInput = z.infer<typeof submitAnswerSchema>;

export const codingSubmissionSchema = z.object({
  assignmentId: z.string().uuid(),
  sourceCode: z.string().min(1, 'Source code cannot be empty'),
  language: z.enum(['PYTHON', 'JAVASCRIPT', 'CPP', 'JAVA']),
});

export type CodingSubmissionInput = z.infer<typeof codingSubmissionSchema>;

export const createAssessmentSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  assessmentType: z.enum(['QUIZ', 'EXAM', 'PRACTICE']),
  totalMarks: z.number().positive(),
  passingMarks: z.number().positive(),
  durationMinutes: z.number().positive(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
});

export type CreateAssessmentInput = z.infer<typeof createAssessmentSchema>;
