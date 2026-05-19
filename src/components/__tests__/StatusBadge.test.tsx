import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

// 紅燈測試：StatusBadge 四值 data-testid + 文字
// 實作在 src/components/StatusBadge.tsx（待新增）

describe("StatusBadge", () => {
  it("draft → status-badge-draft 草稿", async () => {
    const { StatusBadge } = await import("../StatusBadge");
    render(<StatusBadge status="draft" />);
    expect(screen.getByTestId("status-badge-draft").textContent).toContain("草稿");
  });

  it("keyin → status-badge-keyin 填入中", async () => {
    const { StatusBadge } = await import("../StatusBadge");
    render(<StatusBadge status="keyin" />);
    expect(screen.getByTestId("status-badge-keyin").textContent).toContain("填入中");
  });

  it("completed → status-badge-completed 完成", async () => {
    const { StatusBadge } = await import("../StatusBadge");
    render(<StatusBadge status="completed" />);
    expect(screen.getByTestId("status-badge-completed").textContent).toContain("完成");
  });

  it("exported → status-badge-exported 已匯出（非完成）", async () => {
    const { StatusBadge } = await import("../StatusBadge");
    render(<StatusBadge status="exported" />);
    const el = screen.getByTestId("status-badge-exported");
    expect(el.textContent).toContain("已匯出");
    expect(el.textContent).not.toContain("完成");
  });
});
