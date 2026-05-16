import { safeInvoke as baseSafeInvoke } from "./tauri-bridge";

export { NotInTauriError, isTauriEnv } from "./tauri-bridge";

export async function safeInvoke<T>(
  cmd: string,
  args?: Record<string, unknown>,
): Promise<T> {
  return baseSafeInvoke<T>(cmd, args);
}
