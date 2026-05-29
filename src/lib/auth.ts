import { safeInvoke } from "@/lib/tauri-bridge";
import { mockInvoke } from "@/lib/mock-backend";

export type AuthRole = "admin" | "user";

export interface AuthUser {
  email: string;
  role: AuthRole;
}

export type LoginResponse = {
  success: true;
  user: AuthUser;
};

export type BootstrapLoginResponse = LoginResponse & {
  bootstrapOnly: true;
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
  return invokeAuthCommand<LoginResponse>("login", {
    email,
    password,
  });
}

export function exchangeDesktopBootstrapCode(
  email: string,
  code: string,
): Promise<BootstrapLoginResponse> {
  return invokeAuthCommand<BootstrapLoginResponse>("exchange_desktop_bootstrap_code", {
    email,
    code,
  });
}

export function logout(): Promise<{ success: true }> {
  return invokeAuthCommand<{ success: true }>("logout");
}

export function getSession(): Promise<SessionResponse> {
  return invokeAuthCommand<SessionResponse>("get_session");
}

export function getDeviceSessionStatus(): Promise<{
  status: "active" | "missing";
  email: string | null;
  persistedAt: string | null;
}> {
  return invokeAuthCommand("get_device_session_status");
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session.authenticated;
}

async function invokeAuthCommand<T>(
  command:
    | "login"
    | "logout"
    | "get_session"
    | "exchange_desktop_bootstrap_code"
    | "get_device_session_status",
  args?: Record<string, unknown>,
): Promise<T> {
  try {
    return args === undefined
      ? await safeInvoke<T>(command)
      : await safeInvoke<T>(command, args);
  } catch (error) {
    if (!shouldUseLocalAuthFallback(error)) {
      throw error;
    }
    return args === undefined
      ? mockInvoke<T>(command)
      : mockInvoke<T>(command, args);
  }
}

function shouldUseLocalAuthFallback(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("LocalApiNotWiredError") ||
    message.includes("此功能需在 AIRE 桌面 App 中使用") ||
    message.includes("not found") ||
    message.includes("unknown command") ||
    message.includes("Command") ||
    message.includes('command "')
  );
}
