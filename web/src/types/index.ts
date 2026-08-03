export enum RoleName {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
}

export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT';

export enum QuestionType {
  SINGLE_CHOICE = 'SINGLE_CHOICE',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  TEXT = 'TEXT',
  CODING = 'CODING',
}

export enum AssessmentType {
  QUIZ = 'QUIZ',
  EXAM = 'EXAM',
  PRACTICE = 'PRACTICE',
}

export enum WorkbookStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  EVALUATED = 'EVALUATED',
  FAILED = 'FAILED',
}

export enum SubmissionStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  WRONG_ANSWER = 'WRONG_ANSWER',
  TIME_LIMIT_EXCEEDED = 'TIME_LIMIT_EXCEEDED',
  COMPILATION_ERROR = 'COMPILATION_ERROR',
  RUNTIME_ERROR = 'RUNTIME_ERROR',
}

export enum TransactionType {
  XP = 'XP',
  COIN = 'COIN',
}

export enum NotificationType {
  SYSTEM = 'SYSTEM',
  ASSESSMENT = 'ASSESSMENT',
  BADGE = 'BADGE',
  STREAK = 'STREAK',
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  role: RoleName | UserRole | string;
  isActive?: boolean;
  isEmailVerified?: boolean;
  isOnboarded: boolean;
  createdAt?: string;
  gradeLevel?: string | null;
  studentRegistrationNo?: string | null;
  employeeId?: string | null;
  department?: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: UserProfile;
  tokens: AuthTokens;
}

export interface StudentProfile {
  id: string;
  userId: string;
  studentRegistrationNo: string;
  gradeLevel?: string | null;
  totalXp: number;
  coins: number;
  currentStreak: number;
  maxStreak: number;
}

export interface AssessmentDTO {
  id: string;
  title: string;
  description?: string;
  assessmentType: AssessmentType;
  totalMarks: number;
  passingMarks: number;
  durationMinutes: number;
  startTime?: string;
  endTime?: string;
  isPublished: boolean;
  questionCount?: number;
}

export interface QuestionDTO {
  id: string;
  assessmentId: string;
  questionText: string;
  questionType: QuestionType;
  points: number;
  orderIndex: number;
  explanation?: string;
  options?: OptionDTO[];
}

export interface OptionDTO {
  id: string;
  questionId: string;
  optionText: string;
  isCorrect?: boolean;
  orderIndex: number;
}

export interface WorkbookUploadDTO {
  id: string;
  studentId: string;
  fileName: string;
  fileUrl: string;
  fileSizeBytes: number;
  mimeType: string;
  status: WorkbookStatus;
  createdAt: string;
}

export interface CodingAssignmentDTO {
  id: string;
  title: string;
  problemStatement: string;
  allowedLanguages: string[];
  timeLimitMs: number;
  memoryLimitMb: number;
}

export interface CodingSubmissionDTO {
  id: string;
  assignmentId: string;
  studentId: string;
  sourceCode: string;
  language: string;
  status: SubmissionStatus;
  executionTimeMs?: number;
  memoryUsedKb?: number;
  testCasesPassed?: number;
  totalTestCases?: number;
  errorLog?: string;
  submittedAt: string;
}

export interface LeaderboardEntryDTO {
  id: string;
  studentId: string;
  studentName: string;
  avatarUrl?: string;
  rank: number;
  totalXp: number;
}

export interface NotificationDTO {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
}

// Realtime WebSocket Synchronization Events
export enum SyncEventType {
  XP_UPDATED = 'XP_UPDATED',
  BADGE_UNLOCKED = 'BADGE_UNLOCKED',
  NOTIFICATION_RECEIVED = 'NOTIFICATION_RECEIVED',
  SUBMISSION_EVALUATED = 'SUBMISSION_EVALUATED',
  WORKBOOK_STATUS_CHANGED = 'WORKBOOK_STATUS_CHANGED',
  LEADERBOARD_UPDATED = 'LEADERBOARD_UPDATED',
}

export interface SyncEventPayload<T = unknown> {
  event: SyncEventType;
  userId: string;
  data: T;
  timestamp: number;
}
