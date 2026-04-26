import { exec } from "child_process";
import { promisify } from "util";
import type { CodexStatus, LlmAdapter } from "../types";

const execAsync = promisify(exec);

function classifyCodexError(stderr: string): CodexStatus {
  const lower = stderr.toLowerCase();
  if (
    lower.includes("not logged in") ||
    lower.includes("auth") ||
    lower.includes("unauthorized")
  ) {
    return "not-logged-in";
  }
  if (
    lower.includes("quota") ||
    lower.includes("rate limit") ||
    lower.includes("429")
  ) {
    return "quota-exceeded";
  }
  return "error";
}

export const codexAdapter: LlmAdapter = {
  async run(prompt, timeoutMs) {
    const escaped = prompt.replace(/"/g, '\\"');
    const command = `codex exec "${escaped}"`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const { stdout, stderr } = await execAsync(command, {
        signal: controller.signal as NodeJS.Signals & AbortSignal,
        timeout: timeoutMs,
      });

      if (stderr && !stdout) {
        const status = classifyCodexError(stderr);
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
      const status = classifyCodexError(stderr);
      return { success: false, error: stderr.trim() || error.message, status };
    } finally {
      clearTimeout(timer);
    }
  },

  async runVision() {
    return {
      success: false,
      error: "Vision not supported by codex backend",
      status: "error",
    };
  },

  async check() {
    try {
      await execAsync("codex --version", { timeout: 5000 });
    } catch {
      return "error";
    }

    try {
      await execAsync('codex exec "echo __health_check__"', { timeout: 15000 });
      return "ready";
    } catch (err: unknown) {
      const error = err as { stderr?: string; message?: string };
      const stderr = error.stderr ?? error.message ?? "";
      return classifyCodexError(stderr);
    }
  },
};
