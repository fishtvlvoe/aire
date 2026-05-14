"use client";

// AIRE 編輯案件頁（Task 5.4）
//
// - 載入 case 顯示 header + 對應表單
// - 「刪除」按鈕 + 確認 modal
// - 「標示為完成」按鈕僅在 status='draft' 顯示
//
// Note: Next.js static export 下動態路由 [id] 用 client-side router 取參數。

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  casesApi,
  formatTpeDate,
  propertyTypeLabel,
  statusLabel,
  type CaseRow,
} from "@/lib/cases-api";
import {
  exportDisclosurePdf,
  revealInFolder,
  exportErrorMessage,
  ExportError,
} from "@/lib/export-pdf";
import { loadDraft } from "@/lib/use-draft-autosave";
import { toast } from "@/components/ux/Toaster";

export default function CaseDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [c, setCase] = useState<CaseRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  // 編輯 buffer（content 簡化版：只允許改 case_no / land_lot_no / address / owner_name）
  const [buf, setBuf] = useState<{
    case_no: string;
    land_lot_no: string;
    address: string;
    owner_name: string;
  }>({ case_no: "", land_lot_no: "", address: "", owner_name: "" });

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const row = await casesApi.get(id);
        if (cancelled) return;
        setCase(row);
        setBuf({
          case_no: row.case_no ?? "",
          land_lot_no: row.land_lot_no,
          address: row.address,
          owner_name: row.owner_name ?? "",
        });
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleSave() {
    if (!c) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await casesApi.update(c.id, {
        property_type: c.property_type,
        land_lot_no: buf.land_lot_no,
        address: buf.address,
        owner_name: buf.owner_name || null,
        case_no: buf.case_no || null,
      });
      setCase(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!c) return;
    setSaving(true);
    try {
      await casesApi.delete(c.id);
      router.push("/cases");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSaving(false);
    }
  }

  async function handleExportPdf() {
    if (!c) return;
    setSaving(true);
    setError(null);
    try {
      const payload = (await loadDraft<Record<string, unknown>>(c.id)) ?? {};
      const { outputPath } = await exportDisclosurePdf({
        caseId: c.id,
        propertyType: c.property_type as "residential" | "land",
        caseInfo: {
          case_no: c.case_no ?? undefined,
          land_lot_no: c.land_lot_no,
          address: c.address,
          owner_name: c.owner_name ?? undefined,
          generated_at: new Date().toISOString(),
        },
        company: { name: "AIRE" }, // Phase 1 暫用預設；後續從 settings 撈
        payload,
      });
      // 重新取 case（status 已被後端改成 exported）
      const refreshed = await casesApi.get(c.id);
      setCase(refreshed);
      toast.success("匯出成功", {
        duration: 3000,
        action: {
          label: "開啟所在資料夾",
          onClick: () => {
            void revealInFolder(outputPath);
          },
        },
      });
    } catch (err) {
      if (err instanceof ExportError) {
        if (err.code === "USER_CANCELLED") {
          // 取消不視為錯誤
        } else {
          toast.error(exportErrorMessage(err), { duration: 5000 });
        }
      } else {
        toast.error(err instanceof Error ? err.message : String(err), {
          duration: 5000,
        });
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleMarkCompleted() {
    if (!c) return;
    setSaving(true);
    try {
      const updated = await casesApi.markCompleted(c.id);
      setCase(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  if (error && !c) {
    return (
      <main style={{ padding: 24 }}>
        <p style={{ color: "#b00020" }}>載入失敗：{error}</p>
      </main>
    );
  }

  if (!c) {
    return (
      <main style={{ padding: 24 }}>
        <p>載入中…</p>
      </main>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 12px",
    border: "1px solid #ccc",
    borderRadius: 6,
    fontSize: 14,
  };

  return (
    <main
      style={{
        maxWidth: 720,
        margin: "32px auto",
        padding: 24,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <header style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => router.push("/cases")}
            style={{
              padding: "4px 12px",
              background: "white",
              border: "1px solid #ccc",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            ← 返回
          </button>
          <h1 style={{ margin: 0 }}>
            {c.case_no ?? c.id.slice(0, 8)}（{propertyTypeLabel(c.property_type)}）
          </h1>
          <span
            style={{
              padding: "2px 8px",
              background: c.status === "draft" ? "#eee" : "#dff5e1",
              borderRadius: 4,
              fontSize: 12,
            }}
          >
            {statusLabel(c.status)}
          </span>
        </div>
        <p style={{ color: "#888", fontSize: 12, marginTop: 8 }}>
          建立於 {formatTpeDate(c.created_at)} ・ 最後更新 {formatTpeDate(c.updated_at)}
        </p>
      </header>

      <section style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>
            案件編號
          </label>
          <input
            value={buf.case_no}
            onChange={(e) => setBuf({ ...buf, case_no: e.target.value })}
            style={inputStyle}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>
            地號
          </label>
          <input
            value={buf.land_lot_no}
            onChange={(e) => setBuf({ ...buf, land_lot_no: e.target.value })}
            style={inputStyle}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>
            地址
          </label>
          <input
            value={buf.address}
            onChange={(e) => setBuf({ ...buf, address: e.target.value })}
            style={inputStyle}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>
            屋主姓名
          </label>
          <input
            value={buf.owner_name}
            onChange={(e) => setBuf({ ...buf, owner_name: e.target.value })}
            style={inputStyle}
          />
        </div>
      </section>

      {error ? (
        <div
          role="alert"
          style={{
            marginBottom: 16,
            padding: 12,
            background: "#fdecea",
            color: "#b00020",
            borderRadius: 6,
          }}
        >
          {error}
        </div>
      ) : null}

      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: "8px 16px",
            background: saving ? "#999" : "#111",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "儲存中…" : "儲存變更"}
        </button>

        {c.status === "draft" ? (
          <button
            onClick={handleMarkCompleted}
            disabled={saving}
            style={{
              padding: "8px 16px",
              background: "white",
              color: "#0a7d2a",
              border: "1px solid #0a7d2a",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            標示為完成
          </button>
        ) : null}

        <button
          onClick={handleExportPdf}
          disabled={saving || c.status === "draft"}
          title={c.status === "draft" ? "請先標示為完成才可匯出" : "匯出此案件"}
          style={{
            padding: "8px 16px",
            background: c.status === "draft" ? "#eee" : "#0b6cdc",
            color: c.status === "draft" ? "#888" : "white",
            border: "none",
            borderRadius: 6,
            cursor: c.status === "draft" || saving ? "not-allowed" : "pointer",
          }}
        >
          匯出此案件
        </button>

        <div style={{ flex: 1 }} />

        <button
          onClick={() => setShowDeleteConfirm(true)}
          disabled={saving}
          style={{
            padding: "8px 16px",
            background: "white",
            color: "#b00020",
            border: "1px solid #b00020",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          刪除
        </button>
      </div>

      {showDeleteConfirm ? (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
        >
          <div
            style={{
              background: "white",
              padding: 24,
              borderRadius: 8,
              maxWidth: 400,
              width: "90%",
            }}
          >
            <h2 style={{ marginTop: 0 }}>確認刪除案件？</h2>
            <p style={{ color: "#555" }}>
              此操作不可復原，將永久刪除案件「{c.case_no ?? c.id.slice(0, 8)}」
              以及其表單草稿。
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  padding: "8px 16px",
                  background: "white",
                  border: "1px solid #ccc",
                  borderRadius: 6,
                  cursor: "pointer",
                }}
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                disabled={saving}
                style={{
                  padding: "8px 16px",
                  background: "#b00020",
                  color: "white",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                }}
              >
                {saving ? "刪除中…" : "確認刪除"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
