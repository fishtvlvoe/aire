import { describe, expect, it, beforeAll } from "vitest";
import React from "react";
import { Document, pdf } from "@react-pdf/renderer";
import { writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
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

  it("renders a buyer-facing pending state instead of exterior placeholder copy when no exterior photo exists", async () => {
    const element = (
      <ThemeProvider theme={getTheme("theme-a-minimal")!}>
        <Document>
          <ExteriorPhotoPage exteriorPhoto={null} />
        </Document>
      </ThemeProvider>
    );

    const blob = await pdf(element as Parameters<typeof pdf>[0]).toBlob();
    const buffer = Buffer.from(await blob.arrayBuffer());
    const outputPath = "/tmp/aire-exterior-pending-state.pdf";
    writeFileSync(outputPath, buffer);
    const text = execFileSync("pdftotext", [outputPath, "-"], { encoding: "utf8" });

    expect(blob.size).toBeGreaterThan(1000);
    expect(text).toContain("待補");
    expect(text).not.toContain("未取得街景或外觀照");
  });
});
