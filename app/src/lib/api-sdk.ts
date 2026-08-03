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
  async register(data: RegisterInput): Promise<AuthResponse> {
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

  // ASSESSMENTS API
  async getAssessments(query?: { className?: string; isPublished?: boolean }): Promise<AssessmentDTO[]> {
    const params = new URLSearchParams();
    if (query?.className) params.append('className', query.className);
    if (query?.isPublished !== undefined) params.append('isPublished', String(query.isPublished));

    const res = await this.http.get<AssessmentDTO[]>(`/assessments?${params.toString()}`);
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

  // GROQ AI API
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

  async chatTutor(data: { message: string; conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>; topic?: string }) {
    const res = await this.http.post('/ai/tutor-chat', data);
    return res.data;
  }


  // REALTIME SYNCHRONIZATION
  connectRealtimeSync(wsUrl: string, token: string) {
    if (typeof window === 'undefined' && typeof global === 'undefined') return;

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
