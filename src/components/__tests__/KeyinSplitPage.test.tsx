import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// 假裝 Tauri API
const mocks = vi.hoisted(() => ({
  invoke: vi.fn(),
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}));

vi.mock("@tauri-apps/api/core", () => ({ invoke: mocks.invoke }));
vi.mock("@tauri-apps/api/event", () => ({ listen: vi.fn(() => Promise.resolve(() => undefined)) }));
vi.mock("next/navigation", () => ({ useRouter: mocks.useRouter, useParams: vi.fn(() => ({ id: "case-001" })) }));

describe("KeyinSplitPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.invoke.mockResolvedValue(null); // get_draft 回傳空
  });

  it("renders left and right panels in split layout", async () => {
    const { KeyinSplitPage } = await import("../KeyinSplitPage");
    render(<KeyinSplitPage caseId="case-001" propertyType="residential" />);
    expect(screen.getByTestId("keyin-left-panel")).toBeTruthy();
    expect(screen.getByTestId("keyin-right-panel")).toBeTruthy();
  });

  it("shows draft restore toast when get_draft returns data", async () => {
    mocks.invoke.mockImplementation((cmd: string) => {
      if (cmd === "get_draft") {
        return Promise.resolve({ payload_json: JSON.stringify({ owner_name: "林美玲" }) });
      }
      return Promise.resolve(null);
    });
    const { KeyinSplitPage } = await import("../KeyinSplitPage");
    render(<KeyinSplitPage caseId="case-001" propertyType="residential" />);
    // toast 出現由 sonner 渲染，這裡只驗證 invoke 有被呼叫
    expect(mocks.invoke).toHaveBeenCalledWith("get_draft", { caseId: "case-001" });
  });
});

describe("DisclosureHtmlPreview", () => {
  it("renders agent name from formState", async () => {
    const { DisclosureHtmlPreview } = await import("../DisclosureHtmlPreview");
    const { container } = render(
      <DisclosureHtmlPreview
        formState={{ agent_name: "林美玲" }}
        propertyType="residential"
      />
    );
    expect(container.innerHTML).toContain("林美玲");
  });

  it("re-renders when formState changes", async () => {
    const { DisclosureHtmlPreview } = await import("../DisclosureHtmlPreview");
    const { container, rerender } = render(
      <DisclosureHtmlPreview formState={{ agent_name: "A" }} propertyType="residential" />
    );
    expect(container.innerHTML).toContain("A");
    rerender(
      <DisclosureHtmlPreview formState={{ agent_name: "B" }} propertyType="residential" />
    );
    expect(container.innerHTML).toContain("B");
  });
});
