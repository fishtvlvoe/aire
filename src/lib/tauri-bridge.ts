const TAURI_DETECTION_TIMEOUT_MS = 3000;

type InvokeFn = <T>(cmd: string, args?: Record<string, unknown>) => Promise<T>;

let cachedIsTauri: boolean | null = null;
let detectionPromise: Promise<boolean> | null = null;
let cachedInvoke: InvokeFn | null = null;

export class NotInTauriError extends Error {
  constructor(message = "此功能需在 AIRE 桌面 App 中使用") {
    super(message);
    this.name = "NotInTauriError";
  }
}

async function loadInvokeWithTimeout(): Promise<InvokeFn | null> {
  const timer = new Promise<null>((resolve) => {
    setTimeout(() => resolve(null), TAURI_DETECTION_TIMEOUT_MS);
  });

  const modulePromise = import("@tauri-apps/api/core")
    .then((mod) => (typeof mod.invoke === "function" ? (mod.invoke as InvokeFn) : null))
    .catch(() => null);

  return Promise.race([modulePromise, timer]);
}

export async function isTauriEnv(): Promise<boolean> {
  if (cachedIsTauri !== null) {
    return cachedIsTauri;
  }
  if (detectionPromise) {
    return detectionPromise;
  }

  detectionPromise = (async () => {
    const hasTauriInternals =
      typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
    if (!hasTauriInternals) {
      cachedInvoke = null;
      cachedIsTauri = false;
      return false;
    }

    const invoke = await loadInvokeWithTimeout();
    cachedInvoke = invoke;
    cachedIsTauri = invoke !== null;
    return cachedIsTauri;
  })();

  return detectionPromise;
}

export async function safeInvoke<T>(
  cmd: string,
  args?: Record<string, unknown>,
): Promise<T> {
  const inTauri = await isTauriEnv();
  if (!inTauri || !cachedInvoke) {
    throw new NotInTauriError();
  }

  return cachedInvoke<T>(cmd, args);
}
