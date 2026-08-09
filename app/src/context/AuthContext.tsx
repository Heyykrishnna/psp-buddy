import React, { createContext, useContext, useState, useEffect } from "react";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { UserProfile, AuthResponse, UserRole } from "../types";
import { PSPBuddyApiClient } from "../lib/api-sdk";

declare const process: { env: Record<string, string | undefined> };

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  sendVerificationCode: (
    email: string,
  ) => Promise<{ message: string; verificationCode?: string }>;
  register: (
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    verificationCode: string,
    role?: UserRole,
  ) => Promise<void>;
  onboard: (data: {
    gradeLevel?: string;
    studentRegistrationNo?: string;
    employeeId?: string;
    department?: string;
    avatarUrl?: string;
  }) => Promise<void>;
  loginAsDemo: (role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  apiClient: PSPBuddyApiClient;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

let memoryAccessToken: string | null = null;
let memoryRefreshToken: string | null = null;
let invalidateSession: (() => void) | null = null;

function getMobileApiUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;

  // If explicit production API URL is set in env, use it
  if (envUrl && !envUrl.includes("192.168.1.4")) {
    const isLocal =
      envUrl.includes("localhost") ||
      envUrl.includes("127.0.0.1") ||
      envUrl.includes("192.168.");
    if (!isLocal) {
      return envUrl;
    }
  }

  // On Web: use current browser hostname so port 4000 works on localhost or any LAN IP
  if (
    Platform.OS === "web" &&
    typeof window !== "undefined" &&
    window.location &&
    window.location.hostname
  ) {
    return `http://${window.location.hostname}:4000`;
  }

  // On Expo Go / Physical device: auto-detect Metro server IP from hostUri
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(":")[0];
    if (host && host !== "localhost" && host !== "127.0.0.1") {
      return `http://${host}:4000`;
    }
  }

  // Fallback to valid local envUrl
  if (envUrl && !envUrl.includes("192.168.1.4")) {
    return envUrl;
  }

  // Android emulator fallback
  if (Platform.OS === "android") {
    return "http://10.0.2.2:4000";
  }

  return "http://localhost:4000";
}

const apiClientInstance = new PSPBuddyApiClient({
  baseURL: getMobileApiUrl(),
  getBaseURL: () => getMobileApiUrl(),
  getAccessToken: async () => memoryAccessToken,
  getRefreshToken: async () => memoryRefreshToken,
  setTokens: async (tokens) => {
    memoryAccessToken = tokens.accessToken;
    memoryRefreshToken = tokens.refreshToken;
  },
  onUnauthenticated: () => {
    memoryAccessToken = null;
    memoryRefreshToken = null;
    invalidateSession?.();
  },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [accessToken, setTokenState] = useState<string | null>(null);

  useEffect(() => {
    invalidateSession = () => {
      setTokenState(null);
      setUser(null);
    };
    return () => {
      invalidateSession = null;
    };
  }, []);

  useEffect(() => {
    // Initial check
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, []);

  useEffect(() => {
    if (!user || !accessToken) return;
    const apiUrl = getMobileApiUrl();
    const wsUrl = `${apiUrl.replace(/^http/, "ws")}/ws`;
    apiClientInstance.connectRealtimeSync(wsUrl, accessToken, user.id);
    return () => apiClientInstance.disconnectRealtimeSync();
  }, [user, accessToken]);

  const login = async (email: string, password: string) => {
    try {
      const res = await apiClientInstance.login({ email, password });
      memoryAccessToken = res.tokens.accessToken;
      memoryRefreshToken = res.tokens.refreshToken;
      setTokenState(res.tokens.accessToken);
      setUser(res.user);
    } catch (err: any) {
      const backendMessage = err.response?.data?.message || err.message;
      if (
        err.response ||
        (backendMessage && !backendMessage.includes("Network Error"))
      ) {
        const msg = Array.isArray(backendMessage)
          ? backendMessage.join(", ")
          : backendMessage;
        throw new Error(msg || "Invalid email or password.");
      }
      throw err;
    }
  };

  const sendVerificationCode = async (email: string) => {
    try {
      return await apiClientInstance.sendVerificationCode(email);
    } catch (err: any) {
      const backendMessage = err.response?.data?.message || err.message;
      const msg = Array.isArray(backendMessage)
        ? backendMessage.join(", ")
        : backendMessage;
      throw new Error(msg || "Failed to send verification code.");
    }
  };

  const register = async (
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    verificationCode: string,
    role?: UserRole,
  ) => {
    try {
      const res = await apiClientInstance.register({
        firstName,
        lastName,
        email,
        password,
        verificationCode,
        role: role || "STUDENT",
      });
      memoryAccessToken = res.tokens.accessToken;
      memoryRefreshToken = res.tokens.refreshToken;
      setTokenState(res.tokens.accessToken);
      setUser(res.user);
    } catch (err: any) {
      const backendMessage = err.response?.data?.message || err.message;
      if (
        err.response ||
        (backendMessage && !backendMessage.includes("Network Error"))
      ) {
        const msg = Array.isArray(backendMessage)
          ? backendMessage.join(", ")
          : backendMessage;
        throw new Error(msg || "Registration failed.");
      }
      throw err;
    }
  };

  const loginAsDemo = async (role: UserRole) => {
    const demoEmail =
      role === "TEACHER"
        ? "teacher@lumora.edu"
        : role === "ADMIN"
          ? "admin@lumora.edu"
          : "student@lumora.edu";
    const demoUser: UserProfile = {
      id: `mobile_${role.toLowerCase()}_demo`,
      email: demoEmail,
      firstName:
        role === "TEACHER" ? "Hanna" : role === "ADMIN" ? "Alex" : "Jordan",
      lastName:
        role === "TEACHER" ? "Vance" : role === "ADMIN" ? "Stone" : "Rivera",
      role,
      isOnboarded: true,
      avatarUrl:
        role === "TEACHER"
          ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
          : undefined,
    };
    memoryAccessToken = `demo_token_${role}_${Date.now()}`;
    setTokenState(memoryAccessToken);
    setUser(demoUser);
  };

  const onboard = async (data: {
    gradeLevel?: string;
    studentRegistrationNo?: string;
    employeeId?: string;
    department?: string;
    avatarUrl?: string;
  }) => {
    try {
      const updatedUser = await apiClientInstance.onboard(data);
      if (updatedUser) {
        setUser({
          ...updatedUser,
          isOnboarded: true,
        });
        return;
      }
    } catch (err: any) {
      if (!memoryAccessToken?.startsWith("demo_token_")) {
        throw new Error(err?.response?.data?.message || "Unable to sync onboarding with the server.");
      }
    }
    if (user && memoryAccessToken?.startsWith("demo_token_")) {
      setUser({
        ...user,
        ...data,
        isOnboarded: true,
      });
    }
  };

  const logout = async () => {
    const refreshToken = memoryRefreshToken;
    if (refreshToken && !memoryAccessToken?.startsWith("demo_token_")) {
      await apiClientInstance.logout(refreshToken).catch(() => undefined);
    }
    apiClientInstance.disconnectRealtimeSync();
    apiClientInstance.invalidateCache();
    memoryAccessToken = null;
    memoryRefreshToken = null;
    setTokenState(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        accessToken,
        login,
        sendVerificationCode,
        register,
        onboard,
        loginAsDemo,
        logout,
        apiClient: apiClientInstance,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
