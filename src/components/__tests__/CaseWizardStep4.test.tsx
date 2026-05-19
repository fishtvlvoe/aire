import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { CaseWizardStep4 } from "../case-wizard/CaseWizardStep4";

describe("CaseWizardStep4", () => {
  it("renders placeholder text", () => {
    render(<CaseWizardStep4 />);
    expect(screen.getByText("實價登錄分析功能預留中。")).toBeTruthy();
  });
});
