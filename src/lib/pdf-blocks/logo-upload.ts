import { invoke } from "@tauri-apps/api/core";

export interface LogoMetadata {
  filename: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
}

export interface LogoValidationResult {
  isValid: boolean;
  error?: string;
}

export interface UploadLogoResult {
  success: boolean;
  metadata: LogoMetadata;
}

export interface DeleteLogoResult {
  success: boolean;
  themeId?: string;
}

const PNG_MAGIC_BYTES = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

export async function validateLogoFile(file: File): Promise<LogoValidationResult> {
  if (!file) {
    return { isValid: false, error: "invalid logo file" };
  }
  if (file.size <= 0) {
    return { isValid: false, error: "invalid logo file size" };
  }
  if (file.type !== "image/png") {
    return { isValid: false, error: "invalid logo format, PNG required" };
  }

  const bytes = new Uint8Array(await file.slice(0, PNG_MAGIC_BYTES.length).arrayBuffer());
  const validPngHeader = PNG_MAGIC_BYTES.every((magic, index) => bytes[index] === magic);

  if (!validPngHeader) {
    return { isValid: false, error: "PNG 格式損毀或 invalid header" };
  }

  return { isValid: true };
}

export async function uploadLogo(file: File): Promise<UploadLogoResult> {
  const validation = await validateLogoFile(file);
  if (!validation.isValid) {
    throw new Error(validation.error ?? "invalid logo");
  }

  const fileBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(fileBuffer).toString("base64");

  return invoke<UploadLogoResult>("upload_logo", {
    filename: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
    dataBase64: base64,
  });
}

export async function deleteLogo(): Promise<DeleteLogoResult> {
  const raw = await invoke<{ success: boolean; themeId?: string; theme_id?: string }>(
    "delete_logo",
    { preserve_theme_id: true }
  );

  return {
    success: raw.success,
    themeId: raw.themeId ?? raw.theme_id,
  };
}

