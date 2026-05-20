import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HouseMvpPagePreview } from "@/components/HouseMvpPagePreview";
import {
  HOUSE_OWNERSHIP_NOTES_TEMPLATE,
  HOUSE_TAX_NOTES_TEMPLATE,
  createHouseConditionSurveyDraft,
  createHouseLivingFunctionDraft,
} from "@/lib/page-contracts/house-mvp";

describe("HouseMvpPagePreview", () => {
  it("renders the 38-question survey preview with empty checkboxes and writable space", () => {
    render(
      <HouseMvpPagePreview
        page="condition_survey_highrise"
        payload={createHouseConditionSurveyDraft()}
        caseNo="A-001"
        caseName="測試物件"
      />,
    );

    const preview = screen.getByTestId("house-mvp-preview");
    expect(within(preview).getByText("肆、現況調查表")).toBeTruthy();
    expect(within(preview).getAllByTestId("survey-question-row")).toHaveLength(38);
    expect(within(preview).getAllByLabelText("空白勾選框").length).toBeGreaterThanOrEqual(38);
    expect(preview.textContent).not.toContain("待補");
    expect(preview.textContent).not.toContain("未填");
  });

  it("renders living-function preview with auto-map fallback status and no blocking placeholder", () => {
    render(
      <HouseMvpPagePreview
        page="living_function"
        payload={createHouseLivingFunctionDraft()}
        caseNo="A-002"
        caseName="生活機能測試"
      />,
    );

    const preview = screen.getByTestId("house-mvp-preview");
    expect(within(preview).getByText("位置圖與生活機能")).toBeTruthy();
    expect(within(preview).getByLabelText("位置圖空白區")).toBeTruthy();
    expect(within(preview).getByText("地圖來源：系統自動產生")).toBeTruthy();
    expect(within(preview).getByText("自動產生失敗時可手動上傳覆蓋")).toBeTruthy();
    expect(preview.textContent).not.toContain("待補");
  });

  it("renders fixed ownership clauses and tax notes as controlled template previews", () => {
    render(
      <div>
        <HouseMvpPagePreview
          page="ownership_notes"
          payload={HOUSE_OWNERSHIP_NOTES_TEMPLATE}
          caseNo="A-003"
          caseName="注意事項測試"
        />
        <HouseMvpPagePreview
          page="tax_notes"
          payload={HOUSE_TAX_NOTES_TEMPLATE}
          caseNo="A-003"
          caseName="注意事項測試"
        />
      </div>,
    );

    expect(screen.getAllByTestId("ownership-clause-row")).toHaveLength(11);
    expect(screen.getAllByTestId("tax-note-row")).toHaveLength(7);
    expect(screen.getByText("本表所列稅額均為概算，正確應納稅額以稅捐機關核發稅單金額為準。")).toBeTruthy();
    expect(screen.getAllByTestId("house-mvp-preview").map((node) => node.textContent).join("")).not.toContain(
      "待補",
    );
  });
});
