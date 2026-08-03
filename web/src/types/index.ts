export enum RoleName {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
}

export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT';

export enum QuestionType {
  SINGLE_CHOICE = 'SINGLE_CHOICE',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  TRUE_FALSE = 'TRUE_FALSE',
  SHORT_ANSWER = 'SHORT_ANSWER',
  FILL_IN_BLANKS = 'FILL_IN_BLANKS',
  MATCH_FOLLOWING = 'MATCH_FOLLOWING',
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

export type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD';

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
  className?: string;
  topic?: string;
  assessmentType: AssessmentType | string;
  totalMarks: number;
  passingMarks: number;
  durationMinutes: number;
  hasNegativeMarking?: boolean;
  negativeMarkValue?: number;
  dueDate?: string;
  isWorkbook?: boolean;
  workbookUrl?: string;
  submissionMode?: 'ONLINE_TEST' | 'WORKBOOK_ONLY' | 'HYBRID' | string;
  startTime?: string;
  endTime?: string;
  isPublished: boolean;
  questionCount?: number;
  questions?: QuestionDTO[];
  createdById?: string;
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    questions?: number;
    attempts?: number;
  };
}

export interface QuestionDTO {
  id: string;
  assessmentId?: string;
  questionText: string;
  questionType: QuestionType | string;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | string;
  points: number;
  orderIndex?: number;
  explanation?: string;
  requiresWorkbook?: boolean;
  submissionType?: 'ONLINE_ONLY' | 'WORKBOOK_ONLY' | 'BOTH' | string;
  workbookInstructions?: string;
  correctOptionId?: string;
  trueFalseAnswer?: boolean;
  shortAnswerKeywords?: string[];
  options?: OptionDTO[];
}

export interface OptionDTO {
  id: string;
  questionId?: string;
  optionText: string;
  text?: string;
  isCorrect?: boolean;
  orderIndex: number;
}

export interface AttemptAnswerDTO {
  questionId: string;
  questionText?: string;
  questionType?: string;
  topic?: string;
  points?: number;
  selectedOptionId?: string;
  textAnswer?: string;
  booleanAnswer?: boolean;
  isCorrect?: boolean;
  marksObtained?: number;
  explanation?: string;
}

export interface TopicAnalysisDTO {
  topic: string;
  totalPossible: number;
  obtained: number;
  percentage: number;
  status: string;
}

export interface AssessmentAttemptDTO {
  id: string;
  assessmentId: string;
  studentId: string;
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'EVALUATED';
  startedAt: string;
  submittedAt?: string;
  totalScore?: number;
  maxScore?: number;
  topicAnalysis?: string;
  answers?: AttemptAnswerDTO[];
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

// Analytics Engine DTOs
export interface StudentTopicMasteryDTO {
  topic: string;
  masteryScore: number;
  accuracy: number;
  totalAttempts: number;
  correctAnswers: number;
  assessmentCount: number;
  lastPracticedAt: string;
  status: 'Mastered' | 'Proficient' | 'Needs Improvement';
  isWeak: boolean;
}

export interface StudentOverviewDTO {
  studentId: string;
  totalXp: number;
  currentStreak: number;
  maxStreak: number;
  gradeLevel?: string;
  totalAssessmentsAttempted: number;
  averageScorePercentage: number;
  weakTopicsCount: number;
  masteredTopicsCount: number;
  totalTopicsTracked: number;
}

export interface StudentPerformanceDTO {
  attemptId: string;
  assessmentTitle: string;
  className?: string;
  topic?: string;
  assessmentType: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  submittedAt: string;
  startedAt: string;
}

export interface ClassTopicDTO {
  topic: string;
  studentsTracked: number;
  averageMastery: number;
  weakStudentsCount: number;
  masteredStudentsCount: number;
}

export interface ClassStudentRankingDTO {
  rank: number;
  studentId: string;
  name: string;
  email: string;
  totalXp: number;
  averageScore: number;
  assessmentsAttempted: number;
  weakTopics: { topic: string; masteryScore: number }[];
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
