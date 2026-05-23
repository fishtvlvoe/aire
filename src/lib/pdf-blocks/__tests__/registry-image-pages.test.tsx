import { describe, expect, it, beforeAll } from "vitest";
import React from "react";
import { Document, pdf } from "@react-pdf/renderer";
import { initReactPdfEngine } from "@/lib/pdf-engine/react-pdf-init";
import { ThemeProvider } from "@/lib/pdf-themes/theme-provider";
import { getTheme } from "@/lib/pdf-themes/registry";
import { AerialPhotoPage } from "../aerial-photo-page";
import { ExteriorPhotoPage } from "../exterior-photo-page";
import { LifeAmenitiesPage } from "../life-amenities";

beforeAll(() => {
  initReactPdfEngine();
});

const PNG_HEADER = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);

async function renderImagePages() {
  const element = (
    <ThemeProvider theme={getTheme("theme-a-minimal")!}>
      <Document>
        <LifeAmenitiesPage
          locationMapImage={PNG_HEADER}
          nearbyAmenities={[
            { name: "大安國小", category: "學校", distanceM: 300, address: "臺北市大安區" },
          ]}
        />
        <AerialPhotoPage aerialPhoto={PNG_HEADER} />
        <ExteriorPhotoPage exteriorPhoto={PNG_HEADER} />
      </Document>
    </ThemeProvider>
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return pdf(element as any).toBlob();
}

describe("registry image PDF pages", () => {
  it("renders location map, aerial and exterior pages when image bytes are available", async () => {
    const blob = await renderImagePages();

    expect(blob.size).toBeGreaterThan(1000);
  });
});

