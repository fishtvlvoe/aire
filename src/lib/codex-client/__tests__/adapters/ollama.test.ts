import { afterEach, describe, expect, it, vi } from "vitest";
import { ollamaAdapter } from "../../adapters/ollama";

const fetchMock = vi.fn<typeof fetch>();
vi.stubGlobal("fetch", fetchMock);

afterEach(() => {
  vi.clearAllMocks();
  delete process.env.OLLAMA_BASE_URL;
  delete process.env.OLLAMA_MODEL;
});

describe("ollamaAdapter.run", () => {
  it("成功時回傳 success: true", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ response: "hello" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );

    const result = await ollamaAdapter.run("prompt", 5000);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:11434/api/generate",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          model: "llama3",
          prompt: "prompt",
          stream: false,
        }),
      })
    );
    expect(result).toEqual({
      success: true,
      output: "hello",
      status: "ready",
    });
  });

  it("連線失敗時回傳 error", async () => {
    fetchMock.mockRejectedValueOnce(new Error("connect ECONNREFUSED"));
    const result = await ollamaAdapter.run("prompt", 5000);
    expect(result.success).toBe(false);
    expect(result.status).toBe("error");
  });
});

describe("ollamaAdapter.check", () => {
  it("GET /api/tags 成功時回傳 ready", async () => {
    fetchMock.mockResolvedValueOnce(new Response("{}", { status: 200 }));
    const status = await ollamaAdapter.check();
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:11434/api/tags",
      expect.objectContaining({ method: "GET" })
    );
    expect(status).toBe("ready");
  });

  it("GET /api/tags 失敗時回傳 error", async () => {
    fetchMock.mockResolvedValueOnce(new Response("{}", { status: 500 }));
    const status = await ollamaAdapter.check();
    expect(status).toBe("error");
  });
});
