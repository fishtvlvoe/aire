"use client";

import { useEffect, useMemo, useState } from "react";
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

  // C2: cancelled flag 防止 race condition；加 try/catch 防白屏
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void (async () => {
      try {
        const row = await casesApi.get(caseId);
        if (cancelled) return;
        setOwnerName(row.owner_name ?? "");
        setAddress(row.address ?? "");
        setCaseName(row.case_name ?? "");
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
