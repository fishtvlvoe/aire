import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DossierPage6Notices } from "../DossierPage6Notices";

describe("DossierPage6Notices", () => {
  it("renders six notices with data-notice-index attributes", () => {
    render(<DossierPage6Notices />);
    for (let i = 1; i <= 6; i++) {
      expect(document.querySelector(`[data-notice-index="${i}"]`)).toBeTruthy();
    }
  });

  it("contains 平均地權條例第47條 text", () => {
    render(<DossierPage6Notices />);
    expect(screen.getByText(/平均地權條例第47條/)).toBeTruthy();
  });

  it("contains 房地合一稅 text", () => {
    render(<DossierPage6Notices />);
    expect(screen.getByText(/房地合一稅/)).toBeTruthy();
  });
});
