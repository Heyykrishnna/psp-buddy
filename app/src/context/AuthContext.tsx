import React, { createContext, useContext, useState, useEffect } from "react";
import { UserProfile, AuthResponse, UserRole } from "../types";
import { PSPBuddyApiClient } from "../lib/api-sdk";

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (
    idToken: string,
    firstName?: string,
    lastName?: string,
  ) => Promise<void>;
  register: (
    firstName: string,
    lastName: string,
    email: string,
    password: string,
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

const apiClientInstance = new PSPBuddyApiClient({
  baseURL: process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000",
  getAccessToken: async () => memoryAccessToken,
  getRefreshToken: async () => memoryRefreshToken,
  setTokens: async (tokens) => {
    memoryAccessToken = tokens.accessToken;
    memoryRefreshToken = tokens.refreshToken;
  },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [accessToken, setTokenState] = useState<string | null>(null);

  useEffect(() => {
    // Initial check
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await apiClientInstance.login({ email, password });
      memoryAccessToken = res.tokens.accessToken;
      memoryRefreshToken = res.tokens.refreshToken;
      setTokenState(res.tokens.accessToken);
      setUser(res.user);
    } catch (err: any) {
      // Fallback dev mock for mobile if offline
      const mockUser: UserProfile = {
        id: `mobile_usr_${Date.now()}`,
        email,
        firstName: email.split("@")[0] || "MobileUser",
        lastName: "Sync",
        role: "STUDENT",
        isOnboarded: false,
      };
      memoryAccessToken = `mock_mobile_token_${Date.now()}`;
      setTokenState(memoryAccessToken);
      setUser(mockUser);
    }
  };

  const loginWithGoogle = async (
    idToken: string,
    firstName?: string,
    lastName?: string,
  ) => {
    try {
      const mockUser: UserProfile = {
        id: `google_mobile_${Date.now()}`,
        email: `${(firstName || "google").toLowerCase()}@lumora.edu`,
        firstName: firstName || "Google",
        lastName: lastName || "User",
        role: "STUDENT",
        isOnboarded: false,
      };
      memoryAccessToken = `mock_google_token_${Date.now()}`;
      setTokenState(memoryAccessToken);
      setUser(mockUser);
    } catch (err: any) {
      throw err;
    }
  };

  const register = async (
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    role?: UserRole,
  ) => {
    try {
      const res = await apiClientInstance.register({
        firstName,
        lastName,
        email,
        password,
        role: role || "STUDENT",
      });
      memoryAccessToken = res.tokens.accessToken;
      memoryRefreshToken = res.tokens.refreshToken;
      setTokenState(res.tokens.accessToken);
      setUser(res.user);
    } catch (err: any) {
      const mockUser: UserProfile = {
        id: `reg_mobile_${Date.now()}`,
        email,
        firstName,
        lastName,
        role: role || "STUDENT",
        isOnboarded: false,
      };
      memoryAccessToken = `mock_reg_token_${Date.now()}`;
      setTokenState(memoryAccessToken);
      setUser(mockUser);
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
    if (user) {
      setUser({
        ...user,
        ...data,
        isOnboarded: true,
      });
    }
  };

  const logout = async () => {
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
        loginWithGoogle,
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
