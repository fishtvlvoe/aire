// Codex CLI wrapper — wraps `codex exec` calls inside the container
// Provides structured error classification and timeout handling

import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export type CodexStatus =
  | "ready"
  | "not-logged-in"
  | "quota-exceeded"
  | "error";

export interface CodexResult {
  success: boolean;
  output?: string;
  error?: string;
  status: CodexStatus;
}

// Classify stderr message into a CodexStatus
function classifyError(stderr: string): CodexStatus {
  const lower = stderr.toLowerCase();
  if (lower.includes("not logged in") || lower.includes("auth") || lower.includes("unauthorized")) {
    return "not-logged-in";
  }
  if (lower.includes("quota") || lower.includes("rate limit") || lower.includes("429")) {
    return "quota-exceeded";
  }
  return "error";
}

// Check whether Codex CLI is installed and authenticated
export async function checkCodexStatus(): Promise<CodexStatus> {
  // Step 1: confirm binary exists
  try {
    await execAsync("codex --version", { timeout: 5000 });
  } catch {
    return "error";
  }

  // Step 2: run a minimal prompt to detect auth/quota issues
  try {
    await execAsync('codex exec "echo __health_check__"', { timeout: 15000 });
    return "ready";
  } catch (err: unknown) {
    const error = err as { stderr?: string; message?: string };
    const stderr = error.stderr ?? error.message ?? "";
    return classifyError(stderr);
  }
}

// Execute a codex prompt and return a structured result
export async function runCodex(
  prompt: string,
  timeoutMs = 60000
): Promise<CodexResult> {
  // Escape double-quotes in the prompt for shell safety
  const escaped = prompt.replace(/"/g, '\\"');
  const command = `codex exec "${escaped}"`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const { stdout, stderr } = await execAsync(command, {
      signal: controller.signal as NodeJS.Signals & AbortSignal,
      timeout: timeoutMs,
    });

    // codex may write warnings to stderr even on success; treat non-empty
    // stdout as the success signal unless stderr indicates a real failure.
    if (stderr && !stdout) {
      const status = classifyError(stderr);
      return { success: false, error: stderr.trim(), status };
    }

    return { success: true, output: stdout.trim(), status: "ready" };
  } catch (err: unknown) {
    const error = err as { stderr?: string; message?: string; code?: string };

    if (error.code === "ABORT_ERR" || error.message?.includes("AbortError")) {
      return {
        success: false,
        error: `Codex exec timed out after ${timeoutMs}ms`,
        status: "error",
      };
    }

    const stderr = error.stderr ?? error.message ?? "";
    const status = classifyError(stderr);
    return { success: false, error: stderr.trim() || error.message, status };
  } finally {
    clearTimeout(timer);
  }
}
