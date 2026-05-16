import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { themeAMinimal } from "../theme-a-minimal";
import { themeBProfessional } from "../theme-b-professional";
import { themeCTechElegant } from "../theme-c-tech-elegant";

const caseData = {
  case_no: "AIRE-2026-XYZ",
  address: "台南市東區裕農路 123 號",
  nested: { a: 1, b: "x" },
};

describe("Theme cover", () => {
  it("theme-a cover should not render raw JSON dump", () => {
    const Cover = themeAMinimal.components.Cover;
    render(<Cover caseData={caseData} />);
    expect(screen.queryByText(/\"nested\"/)).not.toBeInTheDocument();
  });

  it("theme-b cover should not render raw JSON dump", () => {
    const Cover = themeBProfessional.components.Cover;
    render(<Cover caseData={caseData} />);
    expect(screen.queryByText(/\"nested\"/)).not.toBeInTheDocument();
  });

  it("theme-c cover should not render raw JSON dump", () => {
    const Cover = themeCTechElegant.components.Cover;
    render(<Cover caseData={caseData} />);
    expect(screen.queryByText(/\"nested\"/)).not.toBeInTheDocument();
  });
});
