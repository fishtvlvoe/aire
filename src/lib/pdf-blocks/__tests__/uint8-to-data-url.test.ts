import { describe, expect, it } from "vitest";
import { uint8ToDataUrl } from "../image-data-url";

describe("uint8ToDataUrl", () => {
  it("PNG magic bytes produce an image/png data URL", () => {
    const result = uint8ToDataUrl(new Uint8Array([0x89, 0x50, 0x4E, 0x47]));

    expect(result).toMatch(/^data:image\/png;base64,/);
  });

  it("JPEG magic bytes produce an image/jpeg data URL", () => {
    const result = uint8ToDataUrl(new Uint8Array([0xFF, 0xD8, 0xFF]));

    expect(result).toMatch(/^data:image\/jpeg;base64,/);
  });
});
