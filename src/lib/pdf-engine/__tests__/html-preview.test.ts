import { describe, expect, it } from "vitest";

import { toIframePreviewHtml } from "../html-preview";

describe("toIframePreviewHtml", () => {
  it("adds preview-only page centering without removing the original document", () => {
    const html = "<html><head><style>.page{width:210mm}</style></head><body><div class=\"page\">A</div></body></html>";

    const result = toIframePreviewHtml(html);

    expect(result).toContain(".page{width:210mm}");
    expect(result).toContain(".page { margin: 0 auto 16px auto !important;");
    expect(result).toContain("<div class=\"page\">A</div>");
  });
});
