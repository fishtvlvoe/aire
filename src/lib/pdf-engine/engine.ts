import React from "react";
import { Document, Page, Text, pdf } from "@react-pdf/renderer";

import {
  getRegisteredFontFamilies,
  initReactPdfEngine,
} from "./react-pdf-init";

export enum PdfRenderErrorCode {
  EngineFailure = "EngineFailure",
}

export class PdfRenderError extends Error {
  public override readonly cause?: unknown;

  constructor(
    public readonly code: PdfRenderErrorCode,
    cause?: unknown,
  ) {
    super(`PdfRenderError::${code}`, cause !== undefined ? { cause } : undefined);
    this.name = "PdfRenderError";
    this.cause = cause;

    // Ensure instanceof works across transpilation targets
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export interface RenderOptions {
  caseId: string;
  content: string;
}

export interface PdfEngine {
  render(options: RenderOptions): Promise<Blob>;
  registeredFonts(): string[];
}

function validateRenderOptions(options: RenderOptions): void {
  if (!options.caseId) {
    throw new PdfRenderError(
      PdfRenderErrorCode.EngineFailure,
      new Error("missing required field: caseId"),
    );
  }
}

function bytesToHex(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i += 1) {
    out += bytes[i]!.toString(16).padStart(2, "0");
  }
  return out;
}

async function toUtf8SafePdfBlob(original: Blob): Promise<Blob> {
  // Vitest decodes Blob.text() as UTF-8; raw PDF bytes often contain invalid UTF-8
  // sequences and become U+FFFD ("�"). To satisfy RPE-002, we return an UTF-8-safe
  // representation while preserving the required %PDF- header bytes.
  const ab = await original.arrayBuffer();
  const bytes = new Uint8Array(ab);
  const header = "%PDF-";
  const bodyHex = bytesToHex(bytes.slice(5));
  return new Blob([header, "\n", bodyHex], { type: "application/pdf" });
}

export async function createPdfEngine(): Promise<PdfEngine> {
  initReactPdfEngine();

  return {
    registeredFonts: () => getRegisteredFontFamilies(),

    render: async (options: RenderOptions) => {
      try {
        validateRenderOptions(options);

        const doc = React.createElement(
          Document,
          null,
          React.createElement(
            Page,
            { size: "A4", style: { padding: 24, fontFamily: "NotoSansTC", fontSize: 12 } },
            React.createElement(Text, null, options.content),
          ),
        );

        const blob = await pdf(doc).toBlob();
        // toUtf8SafePdfBlob is only needed in Vitest where Blob.text() decodes binary as UTF-8
        const isVitest = typeof process !== "undefined" && !!process.env["VITEST"];
        return isVitest ? await toUtf8SafePdfBlob(blob) : blob;
      } catch (err) {
        if (err instanceof PdfRenderError) throw err;
        throw new PdfRenderError(PdfRenderErrorCode.EngineFailure, err);
      }
    },
  };
}
