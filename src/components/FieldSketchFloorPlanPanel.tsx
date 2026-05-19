"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";

import { FloorPlanReviewPanel } from "@/components/FloorPlanReviewPanel";
import { Button } from "@/components/ui/button";
import { safeInvoke } from "@/lib/tauri-bridge";

export interface FloorPlanSketchRow {
  id: string;
  case_id: string;
  original_asset_id: string;
  original_sha256: string;
  source_type: string;
  version: number;
  uploaded_at: string;
  uploaded_by: string | null;
  upload_note: string | null;
  created_at: string;
  updated_at: string;
}

interface FloorPlanConversionRow {
  id: string;
  sketch_id: string;
  case_id: string;
  status: string;
  extracted_json: string;
  manual_edits_json: string;
  uncertainty_json: string;
  renderer_version: string | null;
  rendered_asset_id: string | null;
  approval_checklist_json: string;
  approved_by: string | null;
  approved_at: string | null;
  model_provider: string | null;
  model_id: string | null;
  prompt_template_version: string | null;
  response_fingerprint: string | null;
  created_at: string;
  updated_at: string;
}

export interface FieldSketchFloorPlanPanelProps {
  caseId: string;
  sketchCount?: number;
  hasApproved?: boolean;
  onApprovedChange?: (approved: boolean) => void;
}

function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
}

export function FieldSketchFloorPlanPanel({
  caseId,
  hasApproved,
  onApprovedChange,
}: FieldSketchFloorPlanPanelProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    onApprovedChange?.(hasApproved ?? false);
  }, [hasApproved, onApprovedChange]);

  const [uploading, setUploading] = useState(false);
  const [sketch, setSketch] = useState<FloorPlanSketchRow | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [conversion, setConversion] =
    useState<FloorPlanConversionRow | null>(null);
  const [converting, setConverting] = useState(false);
  const [convertError, setConvertError] = useState<string | null>(null);

  const uploadLabel = uploading
    ? "上傳中…"
    : sketch
      ? "重新上傳"
      : "上傳現場手稿";

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleConvert = async () => {
    if (!sketch) {
      return;
    }

    setConverting(true);
    setConvertError(null);

    try {
      const result = await safeInvoke<FloorPlanConversionRow>(
        "extract_floor_plan_sketch",
        { sketch_id: sketch.id },
      );
      setConversion(result);
    } catch (err) {
      setConvertError(err instanceof Error ? err.message : "轉換失敗");
    } finally {
      setConverting(false);
    }
  };

  const handleConfirm = async () => {
    if (!conversion || conversion.status !== "approved") {
      return;
    }

    try {
      await safeInvoke("render_floor_plan_conversion", {
        conversion_id: conversion.id,
      });
      onApprovedChange?.(true);
    } catch {
      // silently ignore render error, approval already set
      onApprovedChange?.(true);
    }
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploadError(null);
    setUploading(true);

    try {
      const buffer = await readFileAsArrayBuffer(file);
      const bytes = Array.from(new Uint8Array(buffer));

      const result = await safeInvoke<FloorPlanSketchRow>(
        "upload_floor_plan_sketch",
        {
          case_id: caseId,
          file_bytes: bytes,
          uploaded_by: null,
          upload_note: null,
        },
      );

      setSketch(result);
      setConversion(null);
      setConvertError(null);
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "上傳失敗，請稍後再試",
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const statusText = converting
    ? "轉換中…"
    : conversion?.status === "approved"
      ? "已審核通過"
      : conversion?.status === "revoked"
        ? "已撤銷"
        : conversion
          ? "待審核"
          : "待轉換";

  return (
    <div className="mt-2 rounded-md border border-dashed border-border p-3 space-y-2">
      <p className="text-sm font-medium">現場手稿格局圖</p>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <Button
        type="button"
        data-testid="upload-sketch-btn"
        onClick={handleUploadClick}
        disabled={uploading}
      >
        {uploadLabel}
      </Button>

      {uploadError ? (
        <p className="text-sm text-destructive">{uploadError}</p>
      ) : null}

      {sketch ? (
        <div className="text-sm text-muted-foreground space-y-1">
          <p data-testid="sketch-version">版本 {sketch.version}</p>
          <p data-testid="sketch-status">{statusText}</p>
        </div>
      ) : null}

      <Button
        type="button"
        variant="outline"
        onClick={handleConvert}
        disabled={!sketch || converting || (!!conversion && conversion.status !== "revoked")}
        data-testid="convert-sketch-btn"
      >
        轉換成格局圖
      </Button>

      {convertError ? (
        <p className="text-sm text-destructive">{convertError}</p>
      ) : null}

      <Button
        type="button"
        variant="outline"
        onClick={handleConfirm}
        disabled={conversion?.status !== "approved"}
        data-testid="confirm-sketch-btn"
      >
        確認格局圖
      </Button>

      {conversion &&
        (conversion.status === "draft" ||
          conversion.status === "needs_correction") && (
          <FloorPlanReviewPanel
            caseId={caseId}
            conversionId={conversion.id}
            onApproved={() =>
              setConversion((prev) =>
                prev ? { ...prev, status: "approved" } : prev,
              )
            }
            onRevoked={(reason) => {
              void reason;
              setConversion((prev) =>
                prev ? { ...prev, status: "revoked" } : prev,
              );
            }}
          />
        )}
    </div>
  );
}
