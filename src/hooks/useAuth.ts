"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getSession,
  login as loginRequest,
  logout as logoutRequest,
  type AuthUser,
} from "@/lib/auth";

interface UseAuthResult {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

/**
 * 開發環境 mock user — 不走 loginRequest，直接注入 session
 * 只在 NEXT_PUBLIC_DEV_AUTO_LOGIN === "true" 時啟用
 */
const DEV_MOCK_USER: AuthUser = {
  email: "admin@test.aire",
  role: "admin",
};

export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const session = await getSession();
        if (!active) return;

        if (session.authenticated) {
          setUser(session.user);
        } else if (
          process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN === "true"
        ) {
          // 開發環境自動登入：直接設 mock session，不發送密碼
          setUser(DEV_MOCK_USER);
        } else {
          setUser(null);
        }
      } catch {
        if (active) {
          setUser(null);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await loginRequest(email, password);
      setUser(result.user);
      return result.user;
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await logoutRequest();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: user !== null,
    login,
    logout,
  };
}
