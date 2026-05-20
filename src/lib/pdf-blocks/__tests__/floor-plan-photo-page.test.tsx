import { describe, expect, it, beforeAll } from "vitest";
import React from "react";
import { Document, pdf } from "@react-pdf/renderer";
import { initReactPdfEngine } from "@/lib/pdf-engine/react-pdf-init";
import { FloorPlanPhotoPage } from "../floor-plan-photo-page";
import { ThemeProvider } from "@/lib/pdf-themes/theme-provider";
import { getTheme } from "@/lib/pdf-themes/registry";

beforeAll(() => {
  initReactPdfEngine();
});

async function renderPage(photo: Uint8Array | null, title: string) {
  const element = (
    <ThemeProvider theme={getTheme("theme-a-minimal")!}>
      <Document>
        <FloorPlanPhotoPage photo={photo} title={title} />
      </Document>
    </ThemeProvider>
  );
  // PdfDocument also wraps <Document> in ThemeProvider; @react-pdf types only model
  // a raw Document root even though runtime accepts the provider wrapper.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return pdf(element as any).toBlob();
}

describe("FloorPlanPhotoPage", () => {
  it("renders when photo bytes are provided", async () => {
    const blob = await renderPage(new Uint8Array([0x89, 0x50, 0x4E, 0x47]), "格局圖");

    expect(blob.size).toBeGreaterThan(1000);
  });

  it("renders when photo is null", async () => {
    const blob = await renderPage(null, "格局圖");

    expect(blob.size).toBeGreaterThan(1000);
  });

  it("accepts residential and land titles", async () => {
    await expect(renderPage(null, "格局圖")).resolves.toBeTruthy();
    await expect(renderPage(null, "土地規劃圖")).resolves.toBeTruthy();
  });
});
