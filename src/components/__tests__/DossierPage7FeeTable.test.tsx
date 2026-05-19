import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DossierPage7FeeTable } from "../DossierPage7FeeTable";

const defaultProps = {
  contractPrice: 1000000,
  officialLandValue: 800000,
  shareRatio: 1,
  buildingCurrentValue: 200000,
  transactionDate: "2024-01-01",
  usage: "residential" as const,
};

describe("DossierPage7FeeTable", () => {
  it("displays stamp tax 1800", () => {
    render(<DossierPage7FeeTable {...defaultProps} />);
    expect(screen.getByTestId("fee-stamp-tax").textContent).toMatch(/1800/);
  });

  it("displays deed tax 60000", () => {
    render(<DossierPage7FeeTable {...defaultProps} />);
    expect(screen.getByTestId("fee-deed-tax").textContent).toMatch(/60000/);
  });

  it("displays building tax 2400", () => {
    render(<DossierPage7FeeTable {...defaultProps} />);
    expect(screen.getByTestId("fee-building-tax").textContent).toMatch(/2400/);
  });
});
