import axios, { AxiosInstance } from 'axios';
import {
  AuthResponse,
  AuthTokens,
  UserProfile,
  AssessmentDTO,
  CodingSubmissionDTO,
  LeaderboardEntryDTO,
  NotificationDTO,
  SyncEventType,
  SyncEventPayload,
  StudentTopicMasteryDTO,
  StudentOverviewDTO,
} from '../types';
import { RegisterInput, LoginInput, CodingSubmissionInput, SubmitAnswerInput } from '../validation';

export interface ApiClientConfig {
  baseURL: string;
  getAccessToken?: () => Promise<string | null>;
  getRefreshToken?: () => Promise<string | null>;
  setTokens?: (tokens: AuthTokens) => Promise<void>;
  onUnauthenticated?: () => void;
}

export class PSPBuddyApiClient {
  private http: AxiosInstance;
  private syncSubscribers: Map<SyncEventType, Set<(payload: SyncEventPayload) => void>> = new Map();
  private ws: WebSocket | null = null;

  constructor(private config: ApiClientConfig) {
    this.http = axios.create({
      baseURL: config.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.http.interceptors.request.use(async (reqConfig) => {
      if (config.getAccessToken) {
        const token = await config.getAccessToken();
        if (token && reqConfig.headers) {
          reqConfig.headers.Authorization = `Bearer ${token}`;
        }
      }
      return reqConfig;
    });

    this.http.interceptors.response.use(
      (res) => res,
      async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry && config.getRefreshToken && config.setTokens) {
          originalRequest._retry = true;
          try {
            const refreshToken = await config.getRefreshToken();
            if (refreshToken) {
              const res = await axios.post<AuthTokens>(`${config.baseURL}/auth/refresh`, { refreshToken });
              await config.setTokens(res.data);
              originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;
              return this.http(originalRequest);
            }
          } catch (refreshErr) {
            config.onUnauthenticated?.();
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // AUTH API
  async sendVerificationCode(email: string): Promise<{ message: string; verificationCode?: string }> {
    const res = await this.http.post<{ message: string; verificationCode?: string }>('/auth/send-verification-code', { email });
    return res.data;
  }

  async register(data: RegisterInput & { verificationCode: string }): Promise<AuthResponse> {
    const res = await this.http.post<AuthResponse>('/auth/register', data);
    if (this.config.setTokens) {
      await this.config.setTokens(res.data.tokens);
    }
    return res.data;
  }

  async login(data: LoginInput): Promise<AuthResponse> {
    const res = await this.http.post<AuthResponse>('/auth/login', data);
    if (this.config.setTokens) {
      await this.config.setTokens(res.data.tokens);
    }
    return res.data;
  }

  async getProfile(): Promise<UserProfile> {
    const res = await this.http.get<UserProfile>('/user/profile');
    return res.data;
  }

  async onboard(data: {
    gradeLevel?: string;
    studentRegistrationNo?: string;
    employeeId?: string;
    department?: string;
    avatarUrl?: string;
  }): Promise<UserProfile> {
    const res = await this.http.post<UserProfile>('/auth/onboarding', data);
    return res.data;
  }


  // ASSESSMENTS API
  async getAssessments(query?: { className?: string; isPublished?: boolean }): Promise<AssessmentDTO[]> {
    const params = new URLSearchParams();
    if (query?.className) params.append('className', query.className);
    if (query?.isPublished !== undefined) params.append('isPublished', String(query.isPublished));

    const res = await this.http.get<AssessmentDTO[]>(`/assessments?${params.toString()}`);
    return res.data;
  }

  async getStudentAttempts(studentId: string) {
    const res = await this.http.get(`/students/${studentId}/attempts`);
    return res.data;
  }

  async getAssessmentById(id: string): Promise<AssessmentDTO> {
    const res = await this.http.get<AssessmentDTO>(`/assessments/${id}`);
    return res.data;
  }

  async startAttempt(assessmentId: string, studentId: string): Promise<{ id: string; answers?: any[] }> {
    const res = await this.http.post<{ id: string; answers?: any[] }>(`/assessments/${assessmentId}/attempts`, {
      studentId,
    });
    return res.data;
  }

  async autosaveAnswer(attemptId: string, data: { questionId: string; selectedOptionId?: string; textAnswer?: string; booleanAnswer?: boolean }) {
    const res = await this.http.patch<{ success: boolean; savedAt: string; answerId: string }>(
      `/attempts/${attemptId}/answers`,
      data
    );
    return res.data;
  }

  async submitAttempt(attemptId: string) {
    const res = await this.http.post(`/attempts/${attemptId}/submit`);
    return res.data;
  }

  async getAttemptResult(attemptId: string) {
    const res = await this.http.get(`/attempts/${attemptId}/result`);
    return res.data;
  }

  // WORKBOOK API
  async uploadWorkbook(assessmentId: string, data: { studentId?: string; fileUrl: string; fileName?: string }) {
    const res = await this.http.post(`/assessments/${assessmentId}/workbook/upload`, data);
    return res.data;
  }

  async getAssessmentWorkbooks(assessmentId: string) {
    const res = await this.http.get(`/assessments/${assessmentId}/workbooks`);
    return res.data;
  }

  async getStudentWorkbooks(studentId: string) {
    const res = await this.http.get(`/students/${studentId}/workbooks`);
    return res.data;
  }

  async evaluateWorkbook(workbookId: string, data: { obtainedMarks: number; feedback?: string }) {
    const res = await this.http.patch(`/workbooks/${workbookId}/evaluate`, data);
    return res.data;
  }

  // ANALYTICS API
  async getStudentOverview(): Promise<StudentOverviewDTO> {
    const res = await this.http.get<StudentOverviewDTO>('/analytics/student/me');
    return res.data;
  }

  async getTopicMastery(): Promise<StudentTopicMasteryDTO[]> {
    const res = await this.http.get<StudentTopicMasteryDTO[]>('/analytics/student/topics');
    return res.data;
  }

  async getStudentPerformance() {
    const res = await this.http.get('/analytics/student/performance');
    return res.data;
  }

  // CODING API
  async submitCode(data: CodingSubmissionInput): Promise<CodingSubmissionDTO> {
    const res = await this.http.post<CodingSubmissionDTO>('/coding/submit', data);
    return res.data;
  }

  // LEADERBOARD API
  async getLeaderboard(timeframe: 'WEEKLY' | 'MONTHLY' | 'ALL_TIME' = 'ALL_TIME'): Promise<LeaderboardEntryDTO[]> {
    const res = await this.http.get<LeaderboardEntryDTO[]>(`/leaderboard?timeframe=${timeframe}`);
    return res.data;
  }

  // NOTIFICATIONS API
  async getNotifications(): Promise<NotificationDTO[]> {
    const res = await this.http.get<NotificationDTO[]>('/notifications');
    return res.data;
  }

  // AI API
  async generateAiAssessment(data: { topic: string; questionCount?: number; difficulty?: string }) {
    const res = await this.http.post('/ai/generate-assessment', data);
    return res.data;
  }

  async explainQuestion(data: { questionText: string; questionType?: string; studentAnswer?: string; correctAnswer?: string; topic?: string }) {
    const res = await this.http.post('/ai/explain-question', data);
    return res.data;
  }

  async generateStudyPlan(data: { studentName?: string; weakTopics: Array<{ topic: string; masteryScore: number }> }) {
    const res = await this.http.post('/ai/generate-study-plan', data);
    return res.data;
  }

  async chatTutor(data: { message: string; conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>; topic?: string; userId?: string; sessionId?: string }) {
    const res = await this.http.post('/ai/tutor-chat', data);
    return res.data;
  }

  async getChatSessions(userId?: string) {
    const p = userId ? `?userId=${userId}` : '';
    const res = await this.http.get(`/chat/sessions${p}`);
    return res.data;
  }

  async createChatSession(topic?: string, userId?: string) {
    const p = userId ? `?userId=${userId}` : '';
    const res = await this.http.post(`/chat/sessions${p}`, { topic, userId });
    return res.data;
  }

  async getChatMessages(sessionId: string, userId?: string) {
    const p = userId ? `?userId=${userId}` : '';
    const res = await this.http.get(`/chat/sessions/${sessionId}/messages${p}`);
    return res.data;
  }

  async sendChatMessage(sessionId: string, message: string, topic?: string, userId?: string) {
    const p = userId ? `?userId=${userId}` : '';
    const res = await this.http.post(`/chat/sessions/${sessionId}/messages${p}`, { message, topic, userId });
    return res.data;
  }

  // PROBLEMS & PLAYGROUND API
  async getProblems(params?: { difficulty?: string; topic?: string; search?: string; userId?: string; status?: string; bookmarked?: boolean }) {
    const p = new URLSearchParams();
    if (params?.difficulty) p.append('difficulty', params.difficulty);
    if (params?.topic) p.append('topic', params.topic);
    if (params?.search) p.append('search', params.search);
    if (params?.userId) p.append('userId', params.userId);
    if (params?.status) p.append('status', params.status);
    if (params?.bookmarked !== undefined) p.append('bookmarked', String(params.bookmarked));
    const res = await this.http.get(`/problems?${p.toString()}`);
    return res.data;
  }

  async getProblemById(id: string, userId?: string) {
    const p = userId ? `?userId=${userId}` : '';
    const res = await this.http.get(`/problems/${id}${p}`);
    return res.data;
  }

  async runProblemCode(id: string, sourceCode: string, language: string = 'python') {
    const res = await this.http.post(`/problems/${id}/run`, { sourceCode, language });
    return res.data;
  }

  async submitProblem(id: string, sourceCode: string, language: string = 'python') {
    const res = await this.http.post(`/problems/${id}/submit`, { sourceCode, language });
    return res.data;
  }

  async toggleBookmark(id: string, userId?: string) {
    const p = userId ? `?userId=${userId}` : '';
    const res = await this.http.post(`/problems/${id}/bookmark${p}`);
    return res.data;
  }

  async getProblemSubmissions(id: string) {
    const res = await this.http.get(`/problems/${id}/submissions`);
    return res.data;
  }

  // COMPETITIVE HUB API
  async getDailyChallenge() {
    const res = await this.http.get('/competitive/daily-challenge');
    return res.data;
  }

  async getWeeklyChallenge() {
    const res = await this.http.get('/competitive/weekly-challenge');
    return res.data;
  }

  async getCompetitiveLeaderboard(timeframe: 'WEEKLY' | 'MONTHLY' | 'ALL_TIME' = 'ALL_TIME') {
    const res = await this.http.get(`/competitive/leaderboard?timeframe=${timeframe}`);
    return res.data;
  }

  async getContests(status?: string) {
    const p = status ? `?status=${status}` : '';
    const res = await this.http.get(`/competitive/contests${p}`);
    return res.data;
  }

  async registerContest(contestId: string) {
    const res = await this.http.post(`/competitive/contests/${contestId}/register`);
    return res.data;
  }

  async getAchievements() {
    const res = await this.http.get('/competitive/achievements');
    return res.data;
  }

  async getCompetitiveProfile(studentId?: string) {
    const endpoint = studentId ? `/competitive/profile/${studentId}` : '/competitive/profile';
    const res = await this.http.get(endpoint);
    return res.data;
  }


  connectRealtimeSync(wsUrl: string, token: string) {
    if (typeof window === 'undefined' && typeof globalThis === 'undefined') return;

    try {
      this.ws = new WebSocket(`${wsUrl}?token=${token}`);

      this.ws.onmessage = (event) => {
        try {
          const payload: SyncEventPayload = JSON.parse(event.data);
          const subscribers = this.syncSubscribers.get(payload.event);
          if (subscribers) {
            subscribers.forEach((callback) => callback(payload));
          }
        } catch (e) {
          console.error('Failed to parse realtime payload', e);
        }
      };

      this.ws.onclose = () => {
        setTimeout(() => this.connectRealtimeSync(wsUrl, token), 5000);
      };
    } catch (err) {
      console.error('WebSocket connection error:', err);
    }
  }

  subscribeSync(event: SyncEventType, callback: (payload: SyncEventPayload) => void) {
    if (!this.syncSubscribers.has(event)) {
      this.syncSubscribers.set(event, new Set());
    }
    this.syncSubscribers.get(event)!.add(callback);

    return () => {
      this.syncSubscribers.get(event)?.delete(callback);
    };
  }
}
