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

export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const session = await getSession();
        if (!active) {
          return;
        }

        if (session.authenticated) {
          setUser(session.user);
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
