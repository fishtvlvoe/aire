import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const geminiAdapter = {
  check: vi.fn(),
  run: vi.fn(),
  runVision: vi.fn(),
};

const codexAdapter = {
  check: vi.fn(),
  run: vi.fn(),
  runVision: vi.fn(),
};

const claudeCodeAdapter = {
  check: vi.fn(),
  run: vi.fn(),
  runVision: vi.fn(),
};

const ollamaAdapter = {
  check: vi.fn(),
  run: vi.fn(),
  runVision: vi.fn(),
};

vi.mock("../adapters/gemini", () => ({ geminiAdapter }));
vi.mock("../adapters/codex", () => ({ codexAdapter }));
vi.mock("../adapters/claude-code", () => ({ claudeCodeAdapter }));
vi.mock("../adapters/ollama", () => ({ ollamaAdapter }));

beforeEach(() => {
  const mocks = [geminiAdapter, codexAdapter, claudeCodeAdapter, ollamaAdapter];
  mocks.forEach((m) => {
    m.check.mockResolvedValue("error");
    m.run.mockResolvedValue({ success: false, status: "error" });
  });
});

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

describe("runCodex fallback chain", () => {
  it("scenario a: 首選 backend ready → 使用首選，usedBackend 等於首選", async () => {
    const { runCodex } = await loadClient("gemini");

    geminiAdapter.check.mockResolvedValue("ready");
    geminiAdapter.run.mockResolvedValue({
      success: true,
      output: "hello",
      status: "ready",
    });

    const result = await runCodex("test prompt");

    expect(result.success).toBe(true);
    expect(result.usedBackend).toBe("gemini");
  });

  it("scenario b: 首選 quota-exceeded → 第二個 backend 成功", async () => {
    const { runCodex } = await loadClient("gemini");

    geminiAdapter.check.mockResolvedValue("quota-exceeded");
    codexAdapter.check.mockResolvedValue("ready");
    codexAdapter.run.mockResolvedValue({
      success: true,
      output: "fallback result",
      status: "ready",
    });

    const result = await runCodex("test prompt");

    expect(result.success).toBe(true);
    expect(result.usedBackend).toBe("codex");
  });

  it("scenario c: 所有 backend 失敗 → success=false, usedBackend=null", async () => {
    const { runCodex } = await loadClient("gemini");

    const result = await runCodex("test prompt");

    expect(result.success).toBe(false);
    expect(result.usedBackend).toBeNull();
    expect(result.error).toContain("All LLM backends failed");
  });
});
