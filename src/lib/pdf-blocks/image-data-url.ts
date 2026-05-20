export function uint8ToDataUrl(bytes: Uint8Array): string {
  const isJpeg = bytes[0] === 0xFF && bytes[1] === 0xD8;
  const mime = isJpeg ? "image/jpeg" : "image/png";
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 =
    typeof btoa === "function"
      ? btoa(binary)
      : Buffer.from(binary, "binary").toString("base64");
  return `data:${mime};base64,${base64}`;
}
