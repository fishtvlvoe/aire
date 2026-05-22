import "@testing-library/jest-dom/vitest";
import { fireEvent } from "@testing-library/dom";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DemoAlignedWorkbench } from "../workbench/DemoAlignedWorkbench";
import type { CaseRow } from "@/lib/cases-api";

const caseRow: CaseRow = {
  id: "11111111-1111-4111-8111-111111111111",
  case_no: "A-2026-0521",
  case_name: "宜蘭五結農舍",
  property_type: "residential",
  land_lot_no: "五結段 123-1",
  land_lots: ["五結段 123-1", "五結段 123-2"],
  building_lot_no: "建號 88-1",
  address: "宜蘭縣五結鄉協和村親河路二段 1 號",
  owner_name: null,
  land_registry_data: null,
  current_step: 1,
  status: "draft",
  created_at: 1763200000,
  updated_at: 1763200000,
};

describe("DemoAlignedWorkbench", () => {
  it("renders the two-column case/chapter and field review workbench", () => {
    render(<DemoAlignedWorkbench caseData={caseRow} />);

    expect(screen.getByRole("heading", { name: "說明書工作台" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "案件與章節" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "欄位審核" })).toBeInTheDocument();
    expect(screen.getByText("地址與地政判斷")).toBeInTheDocument();
    expect(screen.getByText("已找到 2 筆土地、1 筆建物")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "重新查詢" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "產生補件清單" })).not.toBeInTheDocument();
    expect(screen.getByText("地政重查：後端串接中")).toBeInTheDocument();
    expect(screen.getByText("自動補件：後端串接中")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "現場必問" }).length).toBeGreaterThan(0);
    expect(screen.getByRole("tab", { name: "費用" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "PDF 檢查" })).toBeInTheDocument();
  });

  it("uses customer-facing field labels and hides engineering codes", () => {
    render(<DemoAlignedWorkbench caseData={caseRow} />);

    const workbench = screen.getByTestId("demo-aligned-workbench");
    expect(within(workbench).getByText("建物權利範圍")).toBeInTheDocument();
    expect(within(workbench).getAllByText("建物所有權資料").length).toBeGreaterThan(0);
    expect(within(workbench).getAllByText("門牌建號查詢").length).toBeGreaterThan(0);
    expect(workbench.textContent).not.toMatch(/MOI_API_|COP309|BASIC|pro|advanced|domain_failure/);
  });

  it("uses registry preview data as field review source and keeps supplement actions in the workbench", () => {
    render(
      <DemoAlignedWorkbench
        caseData={{
          ...caseRow,
          owner_name: "陳小美",
          land_registry_data: {
            building_registry: { data: { construction_date: "083/10/18" } },
            building_ownership: { data: { numerator: 1, denominator: 1 } },
          },
        }}
      />,
    );

    const workbench = screen.getByTestId("demo-aligned-workbench");
    expect(within(workbench).getByText("1/1")).toBeInTheDocument();
    expect(within(workbench).getByText("083/10/18")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "補件" }));
    const supplementRegion = screen.getByRole("region", { name: "補件與現場確認" });
    expect(supplementRegion).toBeInTheDocument();
    expect(within(supplementRegion).getByRole("button", { name: "加入補件清單" })).toBeInTheDocument();
    expect(within(supplementRegion).getByRole("button", { name: "現場必問" })).toBeInTheDocument();
    expect(within(supplementRegion).getByLabelText("地籍圖上傳")).toBeInTheDocument();
    expect(within(supplementRegion).getByLabelText("空拍圖上傳")).toBeInTheDocument();
    expect(within(supplementRegion).getByLabelText("格局圖上傳")).toBeInTheDocument();
    expect(within(supplementRegion).getByLabelText("地標圖上傳")).toBeInTheDocument();
    fireEvent.click(within(supplementRegion).getByRole("button", { name: "加入補件清單" }));
    expect(within(supplementRegion).getByText("已加入補件清單")).toBeInTheDocument();
  });

  it("switches workbench tabs instead of showing every panel at once", () => {
    render(<DemoAlignedWorkbench caseData={caseRow} initialTab="supplements" />);

    expect(screen.getByRole("tab", { name: "補件" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("region", { name: "補件與現場確認" })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "費用摘要" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "費用" }));

    expect(screen.getByRole("tab", { name: "費用" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("region", { name: "費用摘要" })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "補件與現場確認" })).not.toBeInTheDocument();
  });
});
