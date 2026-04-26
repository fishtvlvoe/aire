import { claudeCodeAdapter } from "./adapters/claude-code";
import { codexAdapter } from "./adapters/codex";
import { geminiAdapter } from "./adapters/gemini";
import { ollamaAdapter } from "./adapters/ollama";
import type { CodexResult, CodexStatus, LlmAdapter } from "./types";

const DEFAULT_TIMEOUT_MS = 60000;

type LlmBackend = "codex" | "claude-code" | "gemini" | "ollama";

function resolveBackend(rawBackend: string | undefined): LlmBackend {
  switch (rawBackend?.trim()) {
    case "claude-code":
      return "claude-code";
    case "gemini":
      return "gemini";
    case "ollama":
      return "ollama";
    case "codex":
    default:
      return "codex";
  }
}

const adapters: Record<LlmBackend, LlmAdapter> = {
  codex: codexAdapter,
  "claude-code": claudeCodeAdapter,
  gemini: geminiAdapter,
  ollama: ollamaAdapter,
};

const activeBackend = resolveBackend(process.env.LLM_BACKEND);
const activeAdapter = adapters[activeBackend];

export async function checkCodexStatus(): Promise<CodexStatus> {
  return activeAdapter.check();
}

export async function runCodex(
  prompt: string,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<CodexResult> {
  return activeAdapter.run(prompt, timeoutMs);
}

export async function runVision(
  imagePath: string,
  prompt: string,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<CodexResult> {
  if (!activeAdapter.runVision) {
    return {
      success: false,
      error: `Vision not supported by ${activeBackend} backend`,
      status: "error",
    };
  }
  return activeAdapter.runVision(imagePath, prompt, timeoutMs);
}

export type { CodexResult, CodexStatus, LlmAdapter };
