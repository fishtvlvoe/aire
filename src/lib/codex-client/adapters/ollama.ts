import type { LlmAdapter } from "../types";

const DEFAULT_OLLAMA_BASE_URL = "http://localhost:11434";
const DEFAULT_OLLAMA_MODEL = "llama3";

function getOllamaBaseUrl(): string {
  const value = process.env.OLLAMA_BASE_URL?.trim();
  return value || DEFAULT_OLLAMA_BASE_URL;
}

function getOllamaModel(): string {
  const value = process.env.OLLAMA_MODEL?.trim();
  return value || DEFAULT_OLLAMA_MODEL;
}

export const ollamaAdapter: LlmAdapter = {
  async run(prompt, timeoutMs) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${getOllamaBaseUrl()}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: getOllamaModel(),
          prompt,
          stream: false,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Ollama generate failed: HTTP ${response.status}`,
          status: "error",
        };
      }

      const data = (await response.json()) as { response?: string };
      return {
        success: true,
        output: (data.response ?? "").trim(),
        status: "ready",
      };
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Ollama generate failed";
      return { success: false, error: message, status: "error" };
    } finally {
      clearTimeout(timer);
    }
  },

  async runVision() {
    return {
      success: false,
      error: "Vision not supported by ollama backend",
      status: "error",
    };
  },

  async check() {
    try {
      const response = await fetch(`${getOllamaBaseUrl()}/api/tags`, {
        method: "GET",
      });
      return response.ok ? "ready" : "error";
    } catch {
      return "error";
    }
  },
};
