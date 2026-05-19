import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

import { FloorPlanReviewPanel } from "../FloorPlanReviewPanel";

vi.mock("@/lib/tauri-bridge", () => ({
  safeInvoke: vi.fn().mockResolvedValue({}),
}));

function createMockLocalStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear() {
      data.clear();
    },
    getItem(key: string) {
      return data.has(key) ? data.get(key)! : null;
    },
    key(index: number) {
      return [...data.keys()][index] ?? null;
    },
    removeItem(key: string) {
      data.delete(key);
    },
    setItem(key: string, value: string) {
      data.set(key, value);
    },
  };
}

describe("FloorPlanReviewPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    if (!window.localStorage) {
      Object.defineProperty(window, "localStorage", {
        configurable: true,
        value: createMockLocalStorage(),
      });
    }

    window.localStorage.clear();
  });

  it("approve_btn_disabled_when_checklist_incomplete", () => {
    render(
      <FloorPlanReviewPanel caseId="case-1" conversionId="c1" />,
    );

    expect(screen.getByTestId("approve-btn")).toBeDisabled();
  });

  it("approve_btn_enabled_when_all_confirmed", async () => {
    const user = userEvent.setup();

    render(
      <FloorPlanReviewPanel caseId="case-1" conversionId="c1" />,
    );

    const labels = [
      "房間數確認",
      "廚房確認",
      "衛浴確認",
      "陽台確認",
      "入口確認",
      "門窗確認",
      "尺寸來源確認",
      "不確定項目已處理",
    ];

    for (const label of labels) {
      await user.click(screen.getByLabelText(label));
    }

    await user.type(screen.getByLabelText("確認聲明"), "ok");

    expect(screen.getByTestId("approve-btn")).not.toBeDisabled();
  });

  it("both_panels_visible", () => {
    render(
      <FloorPlanReviewPanel
        caseId="case-1"
        conversionId="c1"
        svgContent="<svg/>"
        sketchImageUrl="/test.jpg"
      />,
    );

    expect(screen.getByTestId("original-sketch-img")).toBeInTheDocument();
    expect(screen.getByTestId("clean-floor-plan-svg")).toBeInTheDocument();
  });
});
