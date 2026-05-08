import { spawn } from "child_process";
import { createReadStream, promises as fs } from "fs";
import os from "os";
import path from "path";
import type { CodexStatus, LlmAdapter } from "../types";

async function execPromptFromFileViaStdin(
  bin: string,
  args: string[],
  stdinFile: string,
  timeoutMs: number,
): Promise<{ stdout: string; stderr: string }> {
  return await new Promise((resolve, reject) => {
    const child = spawn(bin, args, { stdio: ["pipe", "pipe", "pipe"] });

    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];

    let didTimeout = false;
    const timeout = setTimeout(() => {
      didTimeout = true;
      child.kill("SIGKILL");
    }, timeoutMs);

    child.stdout.on("data", (chunk: Buffer) => stdoutChunks.push(chunk));
    child.stderr.on("data", (chunk: Buffer) => stderrChunks.push(chunk));

    child.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    child.on("close", () => {
      clearTimeout(timeout);
      if (didTimeout) {
        reject(new Error("Command timed out"));
        return;
      }
      resolve({
        stdout: Buffer.concat(stdoutChunks).toString("utf8"),
        stderr: Buffer.concat(stderrChunks).toString("utf8"),
      });
    });

    if (!child.stdin) {
      clearTimeout(timeout);
      reject(new Error("stdin not available"));
      return;
    }

    const rs = createReadStream(stdinFile);
    rs.on("error", (err) => {
      clearTimeout(timeout);
      child.kill("SIGKILL");
      reject(err);
    });
    rs.pipe(child.stdin);
  });
}

async function execPromptFromStringViaStdin(
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
    const timeout = setTimeout(() => {
      didTimeout = true;
      child.kill("SIGKILL");
    }, timeoutMs);

    child.stdout.on("data", (chunk: Buffer) => stdoutChunks.push(chunk));
    child.stderr.on("data", (chunk: Buffer) => stderrChunks.push(chunk));

    child.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    child.on("close", () => {
      clearTimeout(timeout);
      if (didTimeout) {
        reject(new Error("Command timed out"));
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

function classifyClaudeError(stderr: string): CodexStatus {
  const lower = stderr.toLowerCase();
  if (lower.includes("not logged in") || lower.includes("auth")) {
    return "not-logged-in";
  }
  return "error";
}

export const claudeCodeAdapter: LlmAdapter = {
  async run(prompt, timeoutMs) {
    try {
      const { stdout, stderr } = await execPromptFromStringViaStdin("claude", ["-p", "-"], prompt, timeoutMs);
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

  async runVision(imagePath, prompt, timeoutMs) {
    const ext = path.extname(imagePath).toLowerCase();
    const mime =
      ext === ".pdf"
        ? "application/pdf"
        : ext === ".png"
          ? "image/png"
          : ext === ".webp"
            ? "image/webp"
            : "image/jpeg";

    let tmpFile: string | undefined;

    try {
      const image = await fs.readFile(imagePath);
      const base64 = image.toString("base64");
      const fullPrompt = `文件圖像（${mime}，base64 編碼）：data:${mime};base64,${base64}\n\n${prompt}`;

      tmpFile = path.join(
        os.tmpdir(),
        `vision-${Date.now()}-${Math.random().toString(36).slice(2)}.txt`,
      );
      await fs.writeFile(tmpFile, fullPrompt, "utf8");

      const { stdout, stderr } = await execPromptFromFileViaStdin(
        "claude",
        ["-p", "-"],
        tmpFile,
        timeoutMs,
      );

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
    } finally {
      try {
        if (tmpFile) await fs.unlink(tmpFile);
      } catch {}
    }
  },

  async check() {
    try {
      const { stdout, stderr } = await execPromptFromStringViaStdin("claude", ["--version"], "", 5000);
      if (stderr && !stdout) {
        return classifyClaudeError(stderr);
      }
      return "ready";
    } catch (err: unknown) {
      const error = err as { stderr?: string; message?: string };
      const stderr = error.stderr ?? error.message ?? "";
      return classifyClaudeError(stderr);
    }
  },
};
