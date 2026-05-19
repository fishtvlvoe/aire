import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";

import { FieldSketchFloorPlanPanel } from "@/components/FieldSketchFloorPlanPanel";

describe("FieldSketchFloorPlanPanel (autosave)", () => {
  it("calls onApprovedChange(true) when hasApproved=true is passed", async () => {
    const onApprovedChange = vi.fn();

    render(
      <FieldSketchFloorPlanPanel
        caseId="c1"
        hasApproved={true}
        onApprovedChange={onApprovedChange}
      />,
    );

    await waitFor(() => {
      expect(onApprovedChange).toHaveBeenCalledWith(true);
    });
  });
});
