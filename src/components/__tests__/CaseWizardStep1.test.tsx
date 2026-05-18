import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { CaseWizardStep1 } from "../case-wizard/CaseWizardStep1";
import type { CaseRow, UpdateCaseInput } from "@/lib/cases-api";

const baseCase: CaseRow = {
  id: "case-001",
  case_no: "AIRE-2026-001",
  case_name: "大安區案件",
  property_type: "residential",
  land_lot_no: "大安段 88-1",
  building_lot_no: null,
  address: "台北市大安區忠孝東路四段 168 號",
  owner_name: "陳小明",
  land_registry_data: null,
  current_step: 1,
  status: "draft",
  created_at: 1,
  updated_at: 1,
  asking_price: 30000000,
};

describe("CaseWizardStep1 — 售價欄位", () => {
  it("asking_price 30000000 元 → 顯示 3000 萬元", () => {
    render(
      <CaseWizardStep1
        draft={{}}
        caseData={baseCase}
        onChange={vi.fn()}
        onValidChange={vi.fn()}
      />,
    );

    const input = screen.getByLabelText("售價（萬元）");
    expect((input as HTMLInputElement).value).toBe("3000");
  });

  it("輸入 2500 → onChange 收到 asking_price: 25000000", () => {
    const onChange = vi.fn();
    render(
      <CaseWizardStep1
        draft={{}}
        caseData={baseCase}
        onChange={onChange}
        onValidChange={vi.fn()}
      />,
    );

    const input = screen.getByLabelText("售價（萬元）");
    fireEvent.change(input, { target: { value: "2500" } });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ asking_price: 25000000 }),
    );
  });

  it("清空售價輸入 → onChange 收到 asking_price: null", () => {
    const onChange = vi.fn();
    render(
      <CaseWizardStep1
        draft={{}}
        caseData={baseCase}
        onChange={onChange}
        onValidChange={vi.fn()}
      />,
    );

    const input = screen.getByLabelText("售價（萬元）");
    fireEvent.change(input, { target: { value: "" } });

    const lastCall: UpdateCaseInput = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(lastCall.asking_price).toBeNull();
  });
});
