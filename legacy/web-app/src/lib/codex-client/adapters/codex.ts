import { execFile, spawn } from "child_process";
import { promisify } from "util";
import type { CodexStatus, LlmAdapter } from "../types";

const execFileAsync = promisify(execFile);

async function runProcessWithPrompt(
  bin: string,
  args: string[],
  prompt: string,
  timeoutMs: number,
): Promise<{ stdout: string; stderr: string }> {
  return await new Promise((resolve, reject) => {
    const child = spawn(bin, args, { stdio: ["pipe", "pipe", "pipe"] });
    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];
    let didTimeout = false;

    const timer = setTimeout(() => {
      didTimeout = true;
      child.kill("SIGKILL");
    }, timeoutMs);

    child.stdout.on("data", (chunk: Buffer) => stdoutChunks.push(chunk));
    child.stderr.on("data", (chunk: Buffer) => stderrChunks.push(chunk));
    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on("close", () => {
      clearTimeout(timer);
      if (didTimeout) {
        reject(new Error(`Command timed out after ${timeoutMs}ms`));
        return;
      }
      resolve({
        stdout: Buffer.concat(stdoutChunks).toString("utf8"),
        stderr: Buffer.concat(stderrChunks).toString("utf8"),
      });
    });

    child.stdin.write(prompt);
    child.stdin.end();
  });
}

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
    try {
      const { stdout, stderr } = await runProcessWithPrompt("codex", ["exec"], prompt, timeoutMs);

      if (stderr && !stdout) {
        const status = classifyCodexError(stderr);
        return { success: false, error: stderr.trim(), status };
      }

      return { success: true, output: stdout.trim(), status: "ready" };
    } catch (err: unknown) {
      const error = err as { stderr?: string; message?: string; code?: string };

      if (error.code === "ABORT_ERR" || error.message?.includes("timed out") || error.message?.includes("AbortError")) {
        return {
          success: false,
          error: `Codex exec timed out after ${timeoutMs}ms`,
          status: "error",
        };
      }

      const stderr = error.stderr ?? error.message ?? "";
      const status = classifyCodexError(stderr);
      return { success: false, error: stderr.trim() || error.message, status };
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
      await execFileAsync("codex", ["--version"], { timeout: 5000 });
    } catch {
      return "error";
    }

    try {
      await runProcessWithPrompt("codex", ["exec"], "echo __health_check__", 15000);
      return "ready";
    } catch (err: unknown) {
      const error = err as { stderr?: string; message?: string };
      const stderr = error.stderr ?? error.message ?? "";
      return classifyCodexError(stderr);
    }
  },
};
