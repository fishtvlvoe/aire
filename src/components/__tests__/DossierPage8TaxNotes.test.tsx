import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DossierPage8TaxNotes } from "../DossierPage8TaxNotes";

describe("DossierPage8TaxNotes", () => {
  it("renders seven notes with data-note-index attributes", () => {
    render(<DossierPage8TaxNotes />);
    for (let i = 1; i <= 7; i++) {
      expect(document.querySelector(`[data-note-index="${i}"]`)).toBeTruthy();
    }
  });

  it("note 5 contains 非都市土地持分面積>700m² text", () => {
    render(<DossierPage8TaxNotes />);
    const note5 = document.querySelector('[data-note-index="5"]');
    expect(note5?.textContent).toMatch(/非都市土地持分面積>700m²/);
  });
});
