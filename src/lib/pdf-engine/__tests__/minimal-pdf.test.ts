import { describe, it, expect } from "vitest";
import React from "react";
import { Document, Page, Text, pdf } from "@react-pdf/renderer";
import { initReactPdfEngine } from "../react-pdf-init";
import { writeFileSync } from "fs";

describe("Minimal PDF sanity", () => {
  it("renders a basic Document", async () => {
    initReactPdfEngine();
    const doc = React.createElement(
      Document,
      null,
      React.createElement(
        Page,
        { size: "A4", style: { padding: 24, fontFamily: "NotoSansTC", fontSize: 12 } },
        React.createElement(Text, null, "Hello 測試"),
      ),
    );
    const blob = await pdf(doc).toBlob();
    expect(blob.size).toBeGreaterThan(100);
    const buffer = Buffer.from(await blob.arrayBuffer());
    writeFileSync("/tmp/minimal.pdf", buffer);
    console.log(`✅ Minimal PDF: ${buffer.length} bytes`);
  });

  it("renders Document with Fragment children (multiple pages)", async () => {
    initReactPdfEngine();
    const pages = React.createElement(
      React.Fragment,
      null,
      React.createElement(
        Page,
        { size: "A4", style: { padding: 24, fontFamily: "NotoSansTC" } },
        React.createElement(Text, null, "Page 1"),
      ),
      React.createElement(
        Page,
        { size: "A4", style: { padding: 24, fontFamily: "NotoSansTC" } },
        React.createElement(Text, null, "Page 2"),
      ),
    );
    const doc = React.createElement(Document, null, pages);
    const blob = await pdf(doc).toBlob();
    expect(blob.size).toBeGreaterThan(100);
    console.log(`✅ Fragment pages: ${Buffer.from(await blob.arrayBuffer()).length} bytes`);
  });

  it("renders Document with null children should fail or be filtered", async () => {
    initReactPdfEngine();
    const doc = React.createElement(
      Document,
      null,
      React.createElement(
        Page,
        { size: "A4", style: { padding: 24, fontFamily: "NotoSansTC" } },
        React.createElement(Text, null, "Page 1"),
      ),
      null,  // This might cause the crash
      React.createElement(
        Page,
        { size: "A4", style: { padding: 24, fontFamily: "NotoSansTC" } },
        React.createElement(Text, null, "Page 2"),
      ),
    );
    try {
      const blob = await pdf(doc).toBlob();
      console.log(`Fragment with null: ${Buffer.from(await blob.arrayBuffer()).length} bytes — null is OK`);
    } catch (e) {
      console.log(`❌ Fragment with null CRASHES: ${(e as Error).message}`);
    }
  });
});
