import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  HouseMvpWorkbench,
  createDefaultHouseMvpWorkbenchState,
  normalizeHouseMvpWorkbenchState,
} from "@/components/HouseMvpWorkbench";
import { getPlanEntitlements } from "@/lib/plan-entitlements";

describe("HouseMvpWorkbench", () => {
  it("marks field survey and formal supplement as separate workbench modes using the same state shape", () => {
    const state = createDefaultHouseMvpWorkbenchState({ caseNo: "A-004", caseName: "模式測試" });
    const { rerender } = render(<HouseMvpWorkbench mode="field_survey" value={state} onChange={vi.fn()} />);

    expect(screen.getByRole("region", { name: "現場必問工作台" })).toBeTruthy();
    expect(screen.getByTestId("house-mvp-workbench").getAttribute("data-mode")).toBe("field_survey");
    expect(screen.getByText("給業務現場詢問、手寫與拍照；不混入案件建立流程。")).toBeTruthy();

    rerender(<HouseMvpWorkbench mode="formal_supplement" value={state} onChange={vi.fn()} />);

    expect(screen.getByRole("region", { name: "秘書後補工作台" })).toBeTruthy();
    expect(screen.getByTestId("house-mvp-workbench").getAttribute("data-mode")).toBe("formal_supplement");
    expect(screen.getByText(/沿用同一份 Page Contract/)).toBeTruthy();
    expect(screen.getByTestId("house-mvp-preview").textContent).toContain("肆、現況調查表");
  });

  it("renders a Page Contract driven split workbench with the 38-question survey preview", () => {
    render(
      <HouseMvpWorkbench
        value={createDefaultHouseMvpWorkbenchState({ caseNo: "A-001", caseName: "測試物件" })}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByTestId("keyin-left-panel")).toBeTruthy();
    expect(screen.getByTestId("keyin-right-panel")).toBeTruthy();
    expect(screen.getByTestId("house-mvp-workbench")).toBeTruthy();

    const preview = screen.getByTestId("house-mvp-preview");
    expect(within(preview).getByText("肆、現況調查表")).toBeTruthy();
    expect(within(preview).getAllByTestId("survey-question-row")).toHaveLength(38);
    expect(preview.textContent).not.toContain("待補");
    expect(preview.textContent).not.toContain("未填");
  });

  it("renders field-survey common/type/strength/photo fields and switches property type fields", () => {
    const Wrapper = () => {
      const [value, setValue] = React.useState(
        createDefaultHouseMvpWorkbenchState({ caseNo: "A-005", caseName: "現場必問測試" }),
      );
      return <HouseMvpWorkbench value={value} onChange={setValue} />;
    };

    render(<Wrapper />);

    expect(screen.getByLabelText("委託總價")).toBeTruthy();
    expect(screen.getByLabelText("公設比")).toBeTruthy();
    expect(screen.getByLabelText("優點1")).toBeTruthy();
    expect(screen.getByText("正門外觀圖")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("房屋類型"), { target: { value: "店面" } });

    expect(screen.getByLabelText("店面寬")).toBeTruthy();
    expect(screen.queryByLabelText("公設比")).toBeNull();
  });

  it("normalizes older drafts by adding fieldSurvey without dropping existing Page Contract data", () => {
    const olderDraft = createDefaultHouseMvpWorkbenchState({ caseNo: "A-006", caseName: "舊草稿" });
    const draftWithoutFieldSurvey = {
      selectedPage: olderDraft.selectedPage,
      caseNo: olderDraft.caseNo,
      caseName: olderDraft.caseName,
      companyName: olderDraft.companyName,
      conditionSurvey: olderDraft.conditionSurvey,
      livingFunction: olderDraft.livingFunction,
    };

    const normalized = normalizeHouseMvpWorkbenchState(draftWithoutFieldSurvey);

    expect(normalized.caseNo).toBe("A-006");
    expect(normalized.conditionSurvey.questions).toHaveLength(38);
    expect(normalized.fieldSurvey.propertyType).toBe("大樓華廈");
    expect(normalized.supplement.values).toEqual({});
  });

  it("renders formal supplement fields while keeping the same Page Contract preview", () => {
    const Wrapper = () => {
      const [value, setValue] = React.useState(
        createDefaultHouseMvpWorkbenchState({ caseNo: "A-007", caseName: "後補測試" }),
      );
      return <HouseMvpWorkbench mode="formal_supplement" value={value} onChange={setValue} />;
    };

    render(<Wrapper />);

    expect(screen.getByLabelText("建號")).toBeTruthy();
    expect(screen.getByLabelText("合約書條件核對")).toBeTruthy();
    expect(screen.getByLabelText("總戶數 / 公設比 / 管理費核對")).toBeTruthy();
    expect(screen.getByTestId("house-mvp-preview").textContent).toContain("肆、現況調查表");

    fireEvent.change(screen.getByLabelText("建號"), { target: { value: "建號 778-2" } });

    expect((screen.getByLabelText("建號") as HTMLInputElement).value).toBe("建號 778-2");
  });

  it("gates automation controls with customer-facing plan labels", () => {
    const state = createDefaultHouseMvpWorkbenchState({ caseNo: "A-008", caseName: "權限測試" });
    const { rerender } = render(
      <HouseMvpWorkbench entitlement={getPlanEntitlements("basic")} value={state} onChange={vi.fn()} />,
    );

    expect(screen.getByRole("button", { name: /自動抓取實價登錄/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /自動產生空拍圖/ })).toBeDisabled();
    expect(screen.getAllByText("需升級至進階方案").length).toBeGreaterThan(0);
    expect(screen.getByTestId("house-mvp-workbench").textContent).not.toMatch(/BASIC|pro|advanced/);

    rerender(<HouseMvpWorkbench entitlement={getPlanEntitlements("pro")} value={state} onChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: /自動抓取實價登錄/ })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: /自動產生地籍圖/ })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: /自動產生空拍圖/ })).toBeDisabled();

    rerender(<HouseMvpWorkbench entitlement={getPlanEntitlements("advanced")} value={state} onChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: /自動產生空拍圖/ })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: /自動處理格局圖/ })).not.toBeDisabled();
  });

  it("updates the living-function preview from the left structured fields", () => {
    const Wrapper = () => {
      const [value, setValue] = React.useState(
        createDefaultHouseMvpWorkbenchState({ caseNo: "A-002", caseName: "生活機能測試" }),
      );
      return <HouseMvpWorkbench value={value} onChange={setValue} />;
    };

    render(<Wrapper />);

    fireEvent.click(screen.getByRole("button", { name: "位置圖與生活機能" }));
    fireEvent.change(screen.getByLabelText("地址"), {
      target: { value: "台北市大安區仁愛路四段1號" },
    });

    const preview = screen.getByTestId("house-mvp-preview");
    expect(within(preview).getByText("位置圖與生活機能")).toBeTruthy();
    expect(within(preview).getByText("台北市大安區仁愛路四段1號")).toBeTruthy();
    expect(within(preview).getByText("地圖來源：系統自動產生")).toBeTruthy();
  });

  it("keeps legal and tax pages as controlled template previews", () => {
    const Wrapper = () => {
      const [value, setValue] = React.useState(
        createDefaultHouseMvpWorkbenchState({ caseNo: "A-003", caseName: "法務測試" }),
      );
      return <HouseMvpWorkbench value={value} onChange={setValue} />;
    };

    render(<Wrapper />);

    fireEvent.click(screen.getByRole("button", { name: "產權注意事項" }));
    expect(screen.getAllByTestId("ownership-clause-row")).toHaveLength(11);
    expect(screen.queryByLabelText("產權注意事項內文")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "增值稅附註" }));
    expect(screen.getAllByTestId("tax-note-row")).toHaveLength(7);
    expect(screen.getByText("本表所列稅額均為概算，正確應納稅額以稅捐機關核發稅單金額為準。")).toBeTruthy();
  });
});
