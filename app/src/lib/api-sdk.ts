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
  LearningPathDTO,
  LearningLevelDTO,
  StudentTopicMasteryDTO,
  StudentOverviewDTO,
} from '../types';
import { RegisterInput, LoginInput, CodingSubmissionInput, SubmitAnswerInput } from '../validation';

export interface ApiClientConfig {
  baseURL: string;
  getBaseURL?: () => string;
  getAccessToken?: () => Promise<string | null>;
  getRefreshToken?: () => Promise<string | null>;
  setTokens?: (tokens: AuthTokens) => Promise<void>;
  onUnauthenticated?: () => void;
}

export class PSPBuddyApiClient {
  private http: AxiosInstance;
  private syncSubscribers: Map<SyncEventType, Set<(payload: SyncEventPayload) => void>> = new Map();
  private ws: WebSocket | null = null;
  private realtimeShouldReconnect = true;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempt = 0;
  private refreshPromise: Promise<AuthTokens> | null = null;
  private cache = new Map<string, { expiresAt: number; value: unknown }>();
  private inFlightGets = new Map<string, Promise<unknown>>();

  constructor(private config: ApiClientConfig) {
    this.http = axios.create({
      baseURL: config.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 20_000,
    });

    this.http.interceptors.request.use(async (reqConfig) => {
      if (config.getBaseURL) {
        reqConfig.baseURL = config.getBaseURL();
      }
      if (config.getAccessToken) {
        const token = await config.getAccessToken();
        if (token && reqConfig.headers) {
          reqConfig.headers.Authorization = `Bearer ${token}`;
        }
      }
      return reqConfig;
    });

    this.http.interceptors.response.use(
      (res) => {
        if (String(res.config.method || 'get').toLowerCase() !== 'get') this.invalidateCache();
        return res;
      },
      async (error) => {
        const originalRequest = error.config;
        if (!originalRequest) return Promise.reject(error);
        const method = String(originalRequest.method || 'get').toLowerCase();
        if (error.response?.status === 429 && method === 'get' && (!originalRequest._retryCount || originalRequest._retryCount < 2)) {
          originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
          await new Promise((r) => setTimeout(r, 400 * originalRequest._retryCount));
          return this.http(originalRequest);
        }
        if (error.response?.status === 401 && !originalRequest._retry && config.getRefreshToken && config.setTokens) {
          originalRequest._retry = true;
          try {
            if (!this.refreshPromise) {
              this.refreshPromise = (async () => {
                const refreshToken = await config.getRefreshToken!();
                if (!refreshToken) throw new Error('No refresh token available');
                const currentBaseURL = config.getBaseURL ? config.getBaseURL() : config.baseURL;
                const res = await axios.post<{ tokens: AuthTokens }>(`${currentBaseURL}/auth/refresh`, { refreshToken }, { timeout: 10_000 });
                return res.data.tokens;
              })();
            }
            const tokens = await this.refreshPromise;
            await config.setTokens(tokens);
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
            return this.http(originalRequest);
          } catch (refreshErr) {
            config.onUnauthenticated?.();
          } finally {
            this.refreshPromise = null;
          }
        }
        return Promise.reject(error);
      }
    );
  }

  private cachedGet<T>(key: string, request: () => Promise<T>, ttlMs = 12_000): Promise<T> {
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) return Promise.resolve(cached.value as T);

    const running = this.inFlightGets.get(key);
    if (running) return running as Promise<T>;

    const promise = request()
      .then((value) => {
        this.cache.set(key, { value, expiresAt: Date.now() + ttlMs });
        return value;
      })
      .finally(() => this.inFlightGets.delete(key));
    this.inFlightGets.set(key, promise);
    return promise;
  }

  invalidateCache(prefix?: string) {
    if (!prefix) {
      this.cache.clear();
      return;
    }
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) this.cache.delete(key);
    }
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
    return this.cachedGet('profile', async () => (await this.http.get<{ user: UserProfile }>('/auth/me')).data.user, 30_000);
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

  async logout(refreshToken?: string) {
    const res = await this.http.post<{ success: boolean }>('/auth/logout', { refreshToken });
    this.invalidateCache();
    return res.data;
  }


  // ASSESSMENTS API
  async getAssessments(filters?: { className?: string; isPublished?: boolean }): Promise<AssessmentDTO[]> {
    const params = new URLSearchParams();
    if (filters?.className) params.append('className', filters.className);
    if (filters?.isPublished !== undefined) params.append('isPublished', String(filters.isPublished));

    const queryString = params.toString();
    return this.cachedGet(`assessments:${queryString}`, async () => (await this.http.get<AssessmentDTO[]>(`/assessments?${queryString}`)).data);
  }

  async getStudentAttempts(studentId: string) {
    return this.cachedGet(`attempts:${studentId}`, async () => (await this.http.get(`/students/${studentId}/attempts`)).data);
  }

  // GAME LEARNING PATH API
  async getLearningPath(studentId?: string): Promise<LearningPathDTO> {
    return this.cachedGet('learning-path:current', async () => (await this.http.get<LearningPathDTO>('/learning-path')).data, 8_000);
  }

  async getLearningLevel(levelId: string, studentId?: string): Promise<LearningLevelDTO> {
    return this.cachedGet(`learning-level:${levelId}`, async () => (await this.http.get<LearningLevelDTO>(`/learning-path/levels/${levelId}`)).data, 8_000);
  }

  async getAssessmentById(id: string): Promise<AssessmentDTO> {
    return this.cachedGet(`assessment:${id}`, async () => (await this.http.get<AssessmentDTO>(`/assessments/${id}`)).data, 30_000);
  }

  async startAttempt(assessmentId: string, studentId: string): Promise<{ id: string; answers?: any[] }> {
    const res = await this.http.post<{ id: string; answers?: any[] }>(`/assessments/${assessmentId}/attempts`, {
      // The API binds the attempt to the authenticated JWT user.
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
    return this.cachedGet(`attempt-result:${attemptId}`, async () => (await this.http.get(`/attempts/${attemptId}/result`)).data, 30_000);
  }

  // WORKBOOK API
  async uploadWorkbook(assessmentId: string, data: { studentId?: string; fileUrl: string; fileName?: string }) {
    const { fileUrl, fileName } = data;
    const res = await this.http.post(`/assessments/${assessmentId}/workbook/upload`, { fileUrl, fileName });
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
    return this.cachedGet('student-overview', async () => (await this.http.get<StudentOverviewDTO>('/analytics/student/me')).data, 8_000);
  }

  async getTopicMastery(): Promise<StudentTopicMasteryDTO[]> {
    return this.cachedGet('topic-mastery', async () => (await this.http.get<StudentTopicMasteryDTO[]>('/analytics/student/topics')).data, 8_000);
  }

  async getStudentPerformance() {
    return this.cachedGet('student-performance', async () => (await this.http.get('/analytics/student/performance')).data, 8_000);
  }

  // CODING API
  async submitCode(data: CodingSubmissionInput): Promise<CodingSubmissionDTO> {
    const res = await this.http.post<CodingSubmissionDTO>('/coding/submit', data);
    return res.data;
  }

  // LEADERBOARD API
  async getLeaderboard(timeframe: 'WEEKLY' | 'MONTHLY' | 'ALL_TIME' = 'ALL_TIME'): Promise<LeaderboardEntryDTO[]> {
    return this.cachedGet(`leaderboard:${timeframe}`, async () => (await this.http.get<LeaderboardEntryDTO[]>(`/leaderboard?timeframe=${timeframe}`)).data, 8_000);
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
    const res = await this.http.get('/chat/sessions');
    return res.data;
  }

  async createChatSession(topic?: string, userId?: string) {
    const res = await this.http.post('/chat/sessions', { topic });
    return res.data;
  }

  async getChatMessages(sessionId: string, userId?: string) {
    const res = await this.http.get(`/chat/sessions/${sessionId}/messages`);
    return res.data;
  }

  async sendChatMessage(sessionId: string, message: string, topic?: string, userId?: string) {
    const res = await this.http.post(`/chat/sessions/${sessionId}/messages`, { message, topic });
    return res.data;
  }

  // PROBLEMS & PLAYGROUND API
  async getProblems(params?: { difficulty?: string; topic?: string; search?: string; userId?: string; status?: string; bookmarked?: boolean }) {
    const p = new URLSearchParams();
    if (params?.difficulty) p.append('difficulty', params.difficulty);
    if (params?.topic) p.append('topic', params.topic);
    if (params?.search) p.append('search', params.search);
    if (params?.status) p.append('status', params.status);
    if (params?.bookmarked !== undefined) p.append('bookmarked', String(params.bookmarked));
    const res = await this.http.get(`/problems?${p.toString()}`);
    return res.data;
  }

  async getProblemById(id: string, userId?: string) {
    const res = await this.http.get(`/problems/${id}`);
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
    const res = await this.http.post(`/problems/${id}/bookmark`);
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


  connectRealtimeSync(wsUrl: string, token: string, userId?: string) {
    if (!token || token.startsWith('demo_token_')) return;
    if (typeof WebSocket === 'undefined') return;

    try {
      this.realtimeShouldReconnect = true;
      this.ws?.close();
      const params = new URLSearchParams({ token });
      if (userId) params.set('userId', userId);
      this.ws = new WebSocket(`${wsUrl}?${params.toString()}`);
      const expectedUserId = userId;
      this.ws.onopen = () => { this.reconnectAttempt = 0; };

      this.ws.onmessage = (event) => {
        try {
          const payload: SyncEventPayload = JSON.parse(event.data);
          if (!payload?.event || !payload?.timestamp || (expectedUserId && payload.userId !== expectedUserId && payload.userId !== 'GLOBAL')) return;
          this.invalidateCache();
          const subscribers = this.syncSubscribers.get(payload.event);
          if (subscribers) {
            subscribers.forEach((callback) => callback(payload));
          }
        } catch (e) {
          console.error('Failed to parse realtime payload', e);
        }
      };

      this.ws.onclose = () => {
        if (this.realtimeShouldReconnect) {
          const delay = Math.min(30_000, 1_500 * (2 ** this.reconnectAttempt));
          this.reconnectAttempt += 1;
          if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
          this.reconnectTimer = setTimeout(() => this.connectRealtimeSync(wsUrl, token, userId), delay);
        }
      };
    } catch (err) {
      console.error('WebSocket connection error:', err);
    }
  }

  disconnectRealtimeSync() {
    this.realtimeShouldReconnect = false;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
    this.reconnectAttempt = 0;
    this.ws?.close();
    this.ws = null;
  }

  subscribeSync(event: SyncEventType, callback: (payload: SyncEventPayload) => void) {
    if (!this.syncSubscribers.has(event)) {
      this.syncSubscribers.set(event, new Set());
    }
    this.syncSubscribers.get(event)!.add(callback);

    return () => {
      this.syncSubscribers.get(event)?.delete(callback);
      if (this.syncSubscribers.get(event)?.size === 0) this.syncSubscribers.delete(event);
    };
  }
}
