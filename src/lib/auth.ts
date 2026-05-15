import { safeInvoke } from "@/lib/tauri-bridge";

export type AuthRole = "admin" | "user";

export interface AuthUser {
  email: string;
  role: AuthRole;
}

export type LoginResponse = {
  success: true;
  user: AuthUser;
};

export type SessionResponse =
  | {
      authenticated: false;
    }
  | {
      authenticated: true;
      user: AuthUser;
    };

export function login(email: string, password: string): Promise<LoginResponse> {
  return safeInvoke<LoginResponse>("login", {
    email,
    password,
  });
}

export function logout(): Promise<{ success: true }> {
  return safeInvoke<{ success: true }>("logout");
}

export function getSession(): Promise<SessionResponse> {
  return safeInvoke<SessionResponse>("get_session");
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session.authenticated;
}
