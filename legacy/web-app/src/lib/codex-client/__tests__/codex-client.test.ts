import { afterEach, describe, expect, it, vi } from "vitest";

const codexAdapter = {
  run: vi.fn().mockResolvedValue({ success: true, output: "codex", status: "ready" }),
  check: vi.fn().mockResolvedValue("ready"),
};

const claudeCodeAdapter = {
  run: vi.fn().mockResolvedValue({ success: true, output: "claude", status: "ready" }),
  check: vi.fn().mockResolvedValue("ready"),
};

const geminiAdapter = {
  run: vi.fn().mockResolvedValue({ success: true, output: "gemini", status: "ready" }),
  check: vi.fn().mockResolvedValue("ready"),
};

const ollamaAdapter = {
  run: vi.fn().mockResolvedValue({ success: true, output: "ollama", status: "ready" }),
  check: vi.fn().mockResolvedValue("ready"),
};

vi.mock("../adapters/codex", () => ({ codexAdapter }));
vi.mock("../adapters/claude-code", () => ({ claudeCodeAdapter }));
vi.mock("../adapters/gemini", () => ({ geminiAdapter }));
vi.mock("../adapters/ollama", () => ({ ollamaAdapter }));

afterEach(() => {
  delete process.env.LLM_BACKEND;
  vi.clearAllMocks();
  vi.resetModules();
});

async function loadClient(backend?: string) {
  if (backend) {
    process.env.LLM_BACKEND = backend;
  } else {
    delete process.env.LLM_BACKEND;
  }
  return import("../index");
}

describe("LLM_BACKEND dispatcher", () => {
  it("LLM_BACKEND=codex 時委派給 codex adapter", async () => {
    const { runCodex, checkCodexStatus } = await loadClient("codex");
    await runCodex("prompt", 1234);
    await checkCodexStatus();
    expect(codexAdapter.run).toHaveBeenCalledWith("prompt", 1234);
    expect(codexAdapter.check).toHaveBeenCalled();
  });

  it("LLM_BACKEND=claude-code 時委派給 claude-code adapter", async () => {
    const { runCodex, checkCodexStatus } = await loadClient("claude-code");
    await runCodex("prompt", 1234);
    await checkCodexStatus();
    expect(claudeCodeAdapter.run).toHaveBeenCalledWith("prompt", 1234);
    expect(claudeCodeAdapter.check).toHaveBeenCalled();
  });

  it("LLM_BACKEND=gemini 時委派給 gemini adapter", async () => {
    const { runCodex, checkCodexStatus } = await loadClient("gemini");
    await runCodex("prompt", 1234);
    await checkCodexStatus();
    expect(geminiAdapter.run).toHaveBeenCalledWith("prompt", 1234);
    expect(geminiAdapter.check).toHaveBeenCalled();
  });

  it("LLM_BACKEND=ollama 時委派給 ollama adapter", async () => {
    const { runCodex, checkCodexStatus } = await loadClient("ollama");
    await runCodex("prompt", 1234);
    await checkCodexStatus();
    expect(ollamaAdapter.run).toHaveBeenCalledWith("prompt", 1234);
    expect(ollamaAdapter.check).toHaveBeenCalled();
  });

  it("未知 LLM_BACKEND 時 fallback 到 codex adapter", async () => {
    const { runCodex, checkCodexStatus } = await loadClient("unknown");
    await runCodex("prompt", 1234);
    await checkCodexStatus();
    expect(codexAdapter.run).toHaveBeenCalledWith("prompt", 1234);
    expect(codexAdapter.check).toHaveBeenCalled();
  });
});
