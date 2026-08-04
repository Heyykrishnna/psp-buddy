export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  message?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

let accessTokenMemory: string | null = null;
let refreshTokenMemory: string | null = null;

// In-memory GET request cache & in-flight request deduplicator
const getCache = new Map<string, { data: any; timestamp: number }>();
const inFlightRequests = new Map<string, Promise<any>>();
const CACHE_TTL_MS = 2500;

export const clearApiCache = () => {
  getCache.clear();
  inFlightRequests.clear();
};

export const setAccessToken = (token: string | null) => {
  accessTokenMemory = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('psp_access_token', token);
    } else {
      localStorage.removeItem('psp_access_token');
    }
  }
};

export const getAccessToken = (): string | null => {
  if (accessTokenMemory) return accessTokenMemory;
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('psp_access_token');
    if (stored) {
      accessTokenMemory = stored;
      return stored;
    }
  }
  return null;
};

export const setRefreshToken = (token: string | null) => {
  refreshTokenMemory = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('psp_refresh_token', token);
    } else {
      localStorage.removeItem('psp_refresh_token');
    }
  }
};

export const getRefreshToken = (): string | null => {
  if (refreshTokenMemory) return refreshTokenMemory;
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('psp_refresh_token');
    if (stored) {
      refreshTokenMemory = stored;
      return stored;
    }
  }
  return null;
};

export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const token = getAccessToken();
  const cacheKey = `${method}:${endpoint}:${token || 'anon'}`;

  // Serve from cache if GET request is recent (within 2.5s)
  if (method === 'GET') {
    const cached = getCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data as T;
    }
    // Return existing in-flight request if duplicate GET call is fired simultaneously
    if (inFlightRequests.has(cacheKey)) {
      return inFlightRequests.get(cacheKey) as Promise<T>;
    }
  } else {
    // Clear cache on mutations (POST, PUT, PATCH, DELETE)
    getCache.clear();
  }

  const fetchPromise = (async (): Promise<T> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

    let response = await fetch(url, {
      ...options,
      headers,
    });

    // Automatic retry on 429 Too Many Requests (up to 2 retries with backoff)
    let retries = 0;
    while (response.status === 429 && retries < 2) {
      retries++;
      await new Promise((r) => setTimeout(r, 600 * retries));
      response = await fetch(url, {
        ...options,
        headers,
      });
    }

    // Handle Token Refresh on 401
    if (response.status === 401 && !endpoint.includes('/auth/refresh') && !endpoint.includes('/auth/login')) {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        try {
          const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });

          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            const newAccessToken = refreshData.tokens?.accessToken || refreshData.accessToken;
            const newRefreshToken = refreshData.tokens?.refreshToken || refreshData.refreshToken;

            if (newAccessToken) setAccessToken(newAccessToken);
            if (newRefreshToken) setRefreshToken(newRefreshToken);

            headers['Authorization'] = `Bearer ${newAccessToken}`;
            response = await fetch(url, {
              ...options,
              headers,
            });
          } else {
            setAccessToken(null);
            setRefreshToken(null);
          }
        } catch {
          setAccessToken(null);
          setRefreshToken(null);
        }
      }
    }

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ message: 'API request failed' }));
      throw new Error(errorBody.message || `Request failed with status ${response.status}`);
    }

    const data = await response.json();

    if (method === 'GET') {
      getCache.set(cacheKey, { data, timestamp: Date.now() });
    }

    return data;
  })();

  if (method === 'GET') {
    inFlightRequests.set(cacheKey, fetchPromise);
    fetchPromise.finally(() => {
      inFlightRequests.delete(cacheKey);
    });
  }

  return fetchPromise;
}
