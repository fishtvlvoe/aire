import "@testing-library/jest-dom/vitest";

import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PreChargeConfirmDialog } from "@/components/PreChargeConfirmDialog";

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: { children: ReactNode; open: boolean }) =>
    open ? <div>{children}</div> : null,
  DialogContent: ({ children, className }: { children: ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  DialogHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
  DialogDescription: ({ children }: { children: ReactNode }) => <p>{children}</p>,
  DialogFooter: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

describe("PreChargeConfirmDialog", () => {
  it("shows per-api pricing breakdown and formal data explanation", () => {
    render(
      <PreChargeConfirmDialog
        open
        apiCount={2}
        apiIds={["building_registry", "building_ownership"]}
        estimatedCost={20}
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );

    expect(screen.getByText("確認查詢並扣款")).toBeInTheDocument();
    expect(screen.getByText("費用明細")).toBeInTheDocument();
    expect(screen.getAllByText("建物標示資料").length).toBeGreaterThan(0);
    expect(screen.getAllByText("建物所有權資料").length).toBeGreaterThan(0);
    expect(screen.getAllByText("NT$10").length).toBeGreaterThan(0);
    expect(screen.getByText("本次將查詢")).toBeInTheDocument();
    expect(screen.getByText("你將取得")).toBeInTheDocument();
    expect(screen.getByText(/免費前查不收費/)).toBeInTheDocument();
    expect(screen.getByText(/正式查詢結果會寫入案件/)).toBeInTheDocument();
  });
});
