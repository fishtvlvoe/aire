import { claudeCodeAdapter } from "./adapters/claude-code";
import { codexAdapter } from "./adapters/codex";
import { geminiAdapter } from "./adapters/gemini";
import { ollamaAdapter } from "./adapters/ollama";
import type { CodexResult, CodexStatus, LlmAdapter } from "./types";

const DEFAULT_TIMEOUT_MS = 60000;

type LlmBackend = "codex" | "claude-code" | "gemini" | "ollama";

function resolveBackend(rawBackend: string | undefined): LlmBackend {
  // Production 模式（客戶版 Electron）鎖定 Codex，不允許切換
  if (process.env.NEXT_PUBLIC_APP_MODE === "production") {
    return "codex";
  }
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

function buildFallbackChain(preferred: LlmBackend): LlmBackend[] {
  const base: LlmBackend[] = ["gemini", "codex", "claude-code", "ollama"];
  return [preferred, ...base.filter((b) => b !== preferred)];
}

export async function checkCodexStatus(): Promise<CodexStatus> {
  return adapters[activeBackend].check();
}

export async function runCodex(
  prompt: string,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<CodexResult> {
  const chain = buildFallbackChain(activeBackend);

  for (const backend of chain) {
    const adapter = adapters[backend];

    const checkStatus = await adapter.check();
    if (checkStatus !== "ready") {
      continue;
    }

    const result = await adapter.run(prompt, timeoutMs);

    if (result.status === "quota-exceeded") {
      continue;
    }

    return { ...result, usedBackend: backend };
  }

  return {
    success: false,
    error: "All LLM backends failed",
    status: "error",
    usedBackend: null,
  };
}

export async function runVision(
  imagePath: string,
  prompt: string,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<CodexResult> {
  const adapter = adapters[activeBackend];
  if (!adapter.runVision) {
    return {
      success: false,
      error: `Vision not supported by ${activeBackend} backend`,
      status: "error",
    };
  }
  return adapter.runVision(imagePath, prompt, timeoutMs);
}

export type { CodexResult, CodexStatus, LlmAdapter };
