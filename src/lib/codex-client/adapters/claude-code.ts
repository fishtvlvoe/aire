import { exec } from "child_process";
import { promisify } from "util";
import type { CodexStatus, LlmAdapter } from "../types";

const execAsync = promisify(exec);

function classifyClaudeError(stderr: string): CodexStatus {
  const lower = stderr.toLowerCase();
  if (lower.includes("not logged in") || lower.includes("auth")) {
    return "not-logged-in";
  }
  return "error";
}

export const claudeCodeAdapter: LlmAdapter = {
  async run(prompt, timeoutMs) {
    const escaped = prompt.replace(/"/g, '\\"');
    const command = `claude -p "${escaped}"`;

    try {
      const { stdout, stderr } = await execAsync(command, { timeout: timeoutMs });
      if (stderr && !stdout) {
        const status = classifyClaudeError(stderr);
        return { success: false, error: stderr.trim(), status };
      }
      return { success: true, output: stdout.trim(), status: "ready" };
    } catch (err: unknown) {
      const error = err as { stderr?: string; message?: string };
      const stderr = error.stderr ?? error.message ?? "";
      const status = classifyClaudeError(stderr);
      return { success: false, error: stderr.trim() || error.message, status };
    }
  },

  async check() {
    try {
      await execAsync("claude --version", { timeout: 5000 });
      return "ready";
    } catch (err: unknown) {
      const error = err as { stderr?: string; message?: string };
      const stderr = error.stderr ?? error.message ?? "";
      return classifyClaudeError(stderr);
    }
  },
};
