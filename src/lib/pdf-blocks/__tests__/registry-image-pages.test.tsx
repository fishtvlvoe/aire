import { describe, expect, it, beforeAll } from "vitest";
import React from "react";
import { Document, pdf } from "@react-pdf/renderer";
import { writeFileSync } from "node:fs";
import sharp from "sharp";
import { initReactPdfEngine } from "@/lib/pdf-engine/react-pdf-init";
import { ThemeProvider } from "@/lib/pdf-themes/theme-provider";
import { getTheme } from "@/lib/pdf-themes/registry";
import { AerialPhotoPage } from "../aerial-photo-page";
import { ExteriorPhotoPage } from "../exterior-photo-page";
import { LifeAmenitiesPage } from "../life-amenities";

let TEST_PNG: Uint8Array;

beforeAll(async () => {
  initReactPdfEngine();
  TEST_PNG = new Uint8Array(
    await sharp({
      create: {
        width: 64,
        height: 48,
        channels: 3,
        background: { r: 46, g: 125, b: 50 },
      },
    }).png().toBuffer(),
  );
});

async function renderImagePages() {
  const element = (
    <ThemeProvider theme={getTheme("theme-a-minimal")!}>
      <Document>
        <LifeAmenitiesPage
          locationMapImage={TEST_PNG}
          nearbyAmenities={[
            { name: "大安國小", category: "學校", distanceM: 300, address: "臺北市大安區" },
          ]}
        />
        <AerialPhotoPage aerialPhoto={TEST_PNG} />
        <ExteriorPhotoPage exteriorPhoto={TEST_PNG} />
      </Document>
    </ThemeProvider>
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return pdf(element as any).toBlob();
}

describe("registry image PDF pages", () => {
  it("renders location map, aerial and exterior pages when image bytes are available", async () => {
    const blob = await renderImagePages();
    const buffer = Buffer.from(await blob.arrayBuffer());

    expect(blob.size).toBeGreaterThan(1000);
    writeFileSync("/tmp/aire-registry-image-pages.pdf", buffer);
  });
});
