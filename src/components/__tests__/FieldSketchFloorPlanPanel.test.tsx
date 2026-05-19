import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { FieldSketchFloorPlanPanel } from "@/components/FieldSketchFloorPlanPanel";

describe("FieldSketchFloorPlanPanel", () => {
  it("renders all 3 buttons with correct data-testid (all present simultaneously)", () => {
    render(
      <FieldSketchFloorPlanPanel caseId="case_1" sketchCount={1} hasApproved />,
    );

    expect(screen.getByTestId("upload-sketch-btn")).toBeInTheDocument();
    expect(screen.getByTestId("convert-sketch-btn")).toBeInTheDocument();
    expect(screen.getByTestId("confirm-sketch-btn")).toBeInTheDocument();
  });

  it('"convert" is disabled when sketchCount=0', () => {
    render(
      <FieldSketchFloorPlanPanel caseId="case_1" sketchCount={0} hasApproved />,
    );

    expect(screen.getByTestId("convert-sketch-btn")).toBeDisabled();
  });

  it('"confirm" is disabled when hasApproved=false', () => {
    render(
      <FieldSketchFloorPlanPanel caseId="case_1" sketchCount={1} hasApproved={false} />,
    );

    expect(screen.getByTestId("confirm-sketch-btn")).toBeDisabled();
  });
});
