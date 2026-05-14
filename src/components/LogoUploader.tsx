"use client";

import { useEffect, useId, useState, type ChangeEvent } from "react";
import { invoke } from "@tauri-apps/api/core";
import { AlertCircle, Trash2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_LOGO_SIZE = 2 * 1024 * 1024;
const SUPPORTED_MIME = new Set(["image/png", "image/jpeg"]);

export function LogoUploader() {
  const inputId = useId();
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const pickerClass = cn(
    "inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-input px-4 py-3 text-sm font-medium transition-colors",
    "hover:bg-accent hover:text-accent-foreground",
    "disabled:pointer-events-none disabled:opacity-50",
    previewUrl && "border-primary bg-primary/10 text-primary",
  );

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!SUPPORTED_MIME.has(file.type)) {
      setError("僅支援 PNG / JPG 格式");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_LOGO_SIZE) {
      setError("Logo 檔案過大，請壓縮後再上傳（限 2 MiB 以下）");
      event.target.value = "";
      return;
    }

    setError(null);
    setIsSaving(true);

    const previousPreview = previewUrl;
    try {
      const buffer = await file.arrayBuffer();
      const bytes = Array.from(new Uint8Array(buffer));
      await invoke("save_logo", { bytes, mime: file.type });

      const nextPreview = URL.createObjectURL(file);
      setPreviewUrl(nextPreview);
      if (previousPreview) {
        URL.revokeObjectURL(previousPreview);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Logo 上傳失敗，請稍後再試");
    } finally {
      setIsSaving(false);
      event.target.value = "";
    }
  }

  function handleDelete() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setError(null);
  }

  return (
    <section className="space-y-3">
      <h3 className="text-base font-semibold">Logo</h3>

      <input
        id={inputId}
        data-testid="logo-file-input"
        type="file"
        accept="image/png,image/jpeg"
        className="sr-only"
        disabled={isSaving}
        onChange={handleFileChange}
      />

      <label htmlFor={inputId} className={pickerClass} aria-disabled={isSaving}>
        <Upload className="h-4 w-4" aria-hidden />
        {isSaving ? "上傳中…" : "上傳 Logo"}
      </label>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>{error}</p>
        </div>
      )}

      {previewUrl && (
        <div className="flex items-center gap-3 rounded-md border border-border p-3">
          <img
            src={previewUrl}
            alt="Logo 預覽"
            className="h-14 w-14 rounded border border-border object-contain"
          />
          <button
            type="button"
            onClick={handleDelete}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border border-input px-3 py-2 text-sm transition-colors",
              "hover:bg-accent hover:text-accent-foreground",
              "disabled:pointer-events-none disabled:opacity-50",
            )}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            刪除
          </button>
        </div>
      )}
    </section>
  );
}
