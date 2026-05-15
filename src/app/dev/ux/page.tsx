"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ux/LoadingState";
import { EmptyState } from "@/components/ux/EmptyState";
import { ErrorState } from "@/components/ux/ErrorState";
import { ConfirmDialog } from "@/components/ux/ConfirmDialog";
import { Toaster, toast } from "@/components/ux/Toaster";
import {
  AutosaveIndicator,
  type AutosaveState,
} from "@/components/ux/AutosaveIndicator";

/**
 * /dev/ux — UX 元件樣態 demo
 */
export default function UxDemoPage() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [autosave, setAutosave] = useState<AutosaveState>("saved");
  const [savedAt] = useState<Date>(new Date());

  return (
    <div className="container mx-auto p-8 space-y-12">
      <Toaster />
      <header>
        <h1 className="text-3xl font-bold">UX 元件展示</h1>
        <p className="text-muted-foreground">所有 ux atomic 元件樣態</p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">LoadingState</h2>
        <LoadingState label="載入案件中" />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">EmptyState</h2>
        <EmptyState
          title="尚無案件"
          description="按右上角「新增案件」開始"
          action={<Button>新增案件</Button>}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">ErrorState</h2>
        <ErrorState
          reason="無法連線 opcOS,請檢查網路"
          onRetry={() => toast.info("已重試")}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">ConfirmDialog</h2>
        <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
          刪除此案件
        </Button>
        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title="刪除此案件?"
          description="案件資料與草稿將永久刪除,無法復原。"
          destructive
          confirmLabel="確定刪除"
          cancelLabel="取消"
          onConfirm={() => toast.success("已刪除")}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Toaster / toast</h2>
        <div className="flex gap-2">
          <Button onClick={() => toast.success("匯出成功")}>成功</Button>
          <Button variant="secondary" onClick={() => toast.warning("網路暫時不穩,已重試")}>
            警告
          </Button>
          <Button variant="outline" onClick={() => toast.info("提示訊息")}>
            訊息
          </Button>
        </div>
      </section>

      <section className="relative space-y-3 rounded-lg border border-border p-6 min-h-32">
        <h2 className="text-xl font-semibold">AutosaveIndicator</h2>
        <p className="text-sm text-muted-foreground">右上角指示器:</p>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setAutosave("saving")}>
            儲存中
          </Button>
          <Button size="sm" onClick={() => setAutosave("saved")}>
            已儲存
          </Button>
          <Button size="sm" onClick={() => setAutosave("error")}>
            錯誤
          </Button>
          <Button size="sm" variant="outline" onClick={() => setAutosave("idle")}>
            idle
          </Button>
        </div>
        <AutosaveIndicator state={autosave} savedAt={savedAt} />
      </section>
    </div>
  );
}
