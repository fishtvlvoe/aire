import { exec } from "child_process";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { promisify } from "util";
import type { CodexStatus, LlmAdapter } from "../types";

const execAsync = promisify(exec);

function classifyGeminiError(stderr: string): CodexStatus {
  const lower = stderr.toLowerCase();
  if (lower.includes("quota") || lower.includes("429")) {
    return "quota-exceeded";
  }
  if (lower.includes("not logged in") || lower.includes("auth")) {
    return "not-logged-in";
  }
  return "error";
}

export const geminiAdapter: LlmAdapter = {
  async run(prompt, timeoutMs) {
    const escaped = prompt.replace(/"/g, '\\"');
    const command = `gemini -p "${escaped}"`;

    try {
      const { stdout, stderr } = await execAsync(command, { timeout: timeoutMs });
      if (stderr && !stdout) {
        const status = classifyGeminiError(stderr);
        return { success: false, error: stderr.trim(), status };
      }
      return { success: true, output: stdout.trim(), status: "ready" };
    } catch (err: unknown) {
      const error = err as { stderr?: string; message?: string };
      const stderr = error.stderr ?? error.message ?? "";
      const status = classifyGeminiError(stderr);
      return { success: false, error: stderr.trim() || error.message, status };
    }
  },

  async runVision(imagePath, prompt, timeoutMs) {
    const ext = path.extname(imagePath).toLowerCase();
    const mime =
      ext === ".png"
        ? "image/png"
        : ext === ".webp"
          ? "image/webp"
          : "image/jpeg";

    let tmpDir: string | undefined;
    let tmpFile: string | undefined;

    try {
      const image = await fs.readFile(imagePath);
      const base64 = image.toString("base64");
      const visionPrompt = `data:${mime};base64,${base64}\n\n${prompt}`;

      tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "three-ai-vision-"));
      tmpFile = path.join(tmpDir, "vision-prompt.txt");
      await fs.writeFile(tmpFile, visionPrompt, "utf8");

      const escapedPath = tmpFile.replace(/"/g, '\\"');
      const command = `gemini -p "$(cat \"${escapedPath}\")"`;

      const { stdout, stderr } = await execAsync(command, { timeout: timeoutMs });
      if (stderr && !stdout) {
        const status = classifyGeminiError(stderr);
        return { success: false, error: stderr.trim(), status };
      }
      return { success: true, output: stdout.trim(), status: "ready" };
    } catch (err: unknown) {
      const error = err as { stderr?: string; message?: string };
      const stderr = error.stderr ?? error.message ?? "";
      const status = classifyGeminiError(stderr);
      return { success: false, error: stderr.trim() || error.message, status };
    } finally {
      try {
        if (tmpFile) await fs.unlink(tmpFile);
      } catch {}
      try {
        if (tmpDir) await fs.rmdir(tmpDir);
      } catch {}
    }
  },

  async check() {
    try {
      await execAsync("gemini --version", { timeout: 5000 });
      return "ready";
    } catch (err: unknown) {
      const error = err as { stderr?: string; message?: string };
      const stderr = error.stderr ?? error.message ?? "";
      return classifyGeminiError(stderr);
    }
  },
};
