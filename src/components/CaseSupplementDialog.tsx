"use client";

import { useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { casesApi } from "@/lib/cases-api";
import { getRequiredFields as getResidentialRequiredFields } from "@/lib/disclosure-schema-residential";
import { getRequiredFields as getLandRequiredFields } from "@/lib/disclosure-schema-land";

interface CaseSupplementDialogProps {
  caseId: string;
  open: boolean;
  onClose: () => void;
}

const ACCEPTED_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx"];

function getFileExtension(name: string): string {
  const index = name.lastIndexOf(".");
  return index >= 0 ? name.slice(index).toLowerCase() : "";
}

export function CaseSupplementDialog({ caseId, open, onClose }: CaseSupplementDialogProps) {
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [ownerName, setOwnerName] = useState("");
  const [address, setAddress] = useState("");
  const [caseName, setCaseName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [disclosurePayload, setDisclosurePayload] = useState<Record<string, unknown>>({});
  const [disclosureMissingFields, setDisclosureMissingFields] = useState<Array<{ key: string; label: string }>>([]);
  const [disclosureInputs, setDisclosureInputs] = useState<Record<string, string>>({});

  // C2: cancelled flag 防止 race condition；加 try/catch 防白屏
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void (async () => {
      try {
        // 平行取得案件資料與揭露草稿
        const [row, draftResult] = await Promise.all([
          casesApi.get(caseId),
          invoke<{ payload_json: string } | null>("get_draft", { caseId }).catch(() => null),
        ]);
        if (cancelled) return;
        setOwnerName(row.owner_name ?? "");
        setAddress(row.address ?? "");
        setCaseName(row.case_name ?? "");

        // 解析揭露 payload 並找出缺漏欄位
        const payload = draftResult
          ? (JSON.parse(draftResult.payload_json) as Record<string, unknown>)
          : {};
        setDisclosurePayload(payload);

        const requiredFields =
          row.property_type === "land"
            ? getLandRequiredFields("land")
            : getResidentialRequiredFields("residential");

        const missing = requiredFields.filter((f) => {
          const v = payload[f.key];
          return v === "" || v === null || v === undefined;
        });
        setDisclosureMissingFields(missing);
        setDisclosureInputs({});
      } catch (err) {
        if (cancelled) return;
        console.error("[CaseSupplementDialog] 載入案件失敗", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [caseId, open]);

  const missingFields = useMemo(() => {
    return [
      { key: "owner_name", label: "所有權人", value: ownerName },
      { key: "address", label: "地址", value: address },
      { key: "case_name", label: "案件名稱", value: caseName },
    ].filter((field) => field.value.trim().length === 0);
  }, [address, caseName, ownerName]);

  function handleFiles(candidateFiles: FileList | null) {
    if (!candidateFiles) return;
    const accepted: File[] = [];
    for (const file of Array.from(candidateFiles)) {
      const ext = getFileExtension(file.name);
      if (!ACCEPTED_EXTENSIONS.includes(ext)) {
        setFileError("不支援此檔案格式");
        continue;
      }
      accepted.push(file);
    }
    if (accepted.length > 0) {
      setFileError(null);
      setUploadedFiles((prev) => [...prev, ...accepted]);
    }
  }

  // C2: 儲存失敗時顯示 error state，不讓 dialog 卡住
  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    try {
      await casesApi.update(caseId, {
        owner_name: ownerName || null,
        address,
        case_name: caseName || null,
      });

      // 若有填入任何揭露欄位，merge 後存回 draft
      const filledEntries = Object.entries(disclosureInputs).filter(([, v]) => v !== "");
      if (filledEntries.length > 0) {
        const mergedPayload = {
          ...disclosurePayload,
          ...Object.fromEntries(filledEntries),
        };
        try {
          await invoke("save_draft", { caseId, payload: mergedPayload, schemaVersion: 1 });
        } catch (draftErr) {
          console.error("[CaseSupplementDialog] 揭露草稿儲存失敗", draftErr);
          toast("儲存失敗，請重試");
          return; // 不關 dialog
        }
      }

      onClose();
    } catch (err) {
      console.error("[CaseSupplementDialog] 儲存失敗", err);
      setSaveError(err instanceof Error ? err.message : "儲存失敗，請稍後再試");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>補件</DialogTitle>
          <DialogDescription>上傳補件檔案並補齊缺漏欄位。</DialogDescription>
        </DialogHeader>

        <div
          className="rounded-md border border-dashed p-4 text-sm"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            handleFiles(event.dataTransfer.files);
          }}
        >
          <p className="mb-2">拖曳檔案到這裡，或選擇檔案</p>
          <Input
            type="file"
            multiple
            accept={ACCEPTED_EXTENSIONS.join(",")}
            onChange={(event) => handleFiles(event.target.files)}
          />
          {fileError ? <p className="mt-2 text-xs text-destructive">{fileError}</p> : null}
          {uploadedFiles.length > 0 ? (
            <ul className="mt-2 text-xs text-muted-foreground">
              {uploadedFiles.map((file) => (
                <li key={`${file.name}-${file.size}`}>{file.name}</li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium">缺少必填欄位</p>
          {missingFields.length === 0 ? (
            <p className="text-xs text-muted-foreground">目前無缺漏欄位。</p>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="supplement-owner-name">所有權人</Label>
                <Input id="supplement-owner-name" value={ownerName} onChange={(event) => setOwnerName(event.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="supplement-address">地址</Label>
                <Input id="supplement-address" value={address} onChange={(event) => setAddress(event.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="supplement-case-name">案件名稱</Label>
                <Input id="supplement-case-name" value={caseName} onChange={(event) => setCaseName(event.target.value)} />
              </div>
            </>
          )}
          {disclosureMissingFields.map((f) => (
            <div key={f.key} className="space-y-1.5">
              <Label htmlFor={`supplement-disclosure-${f.key}`}>{f.label}</Label>
              <Input
                id={`supplement-disclosure-${f.key}`}
                value={disclosureInputs[f.key] ?? ""}
                onChange={(e) => setDisclosureInputs((prev) => ({ ...prev, [f.key]: e.target.value }))}
              />
            </div>
          ))}
        </div>

        {saveError ? (
          <p role="alert" className="text-xs text-destructive">{saveError}</p>
        ) : null}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "儲存中…" : "儲存"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
