"use client";

// AIRE 案件列表頁（Task 5.2）
//
// - invoke('list_cases') 取資料
// - 空表顯示「尚無案件，按右上角『新增案件』開始」
// - 表格欄位翻譯成中文（成屋/土地、草稿/已完成/已匯出）
// - updated_at 用 Intl.DateTimeFormat('zh-TW', { timeZone: 'Asia/Taipei' }) 格式化

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  casesApi,
  formatTpeDate,
  propertyTypeLabel,
  statusLabel,
  type CaseRow,
} from "@/lib/cases-api";

export default function CasesPage() {
  const [cases, setCases] = useState<CaseRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await casesApi.list();
        if (!cancelled) setCases(rows);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <h1>案件列表</h1>
        <Link
          href="/cases/new"
          style={{
            padding: "8px 16px",
            background: "#111",
            color: "white",
            borderRadius: 6,
            textDecoration: "none",
          }}
        >
          新增案件
        </Link>
      </header>

      {error ? (
        <div
          role="alert"
          style={{
            padding: 12,
            background: "#fdecea",
            color: "#b00020",
            borderRadius: 6,
          }}
        >
          載入失敗：{error}
        </div>
      ) : cases === null ? (
        <p>載入中…</p>
      ) : cases.length === 0 ? (
        <div
          style={{
            padding: 48,
            textAlign: "center",
            background: "#f7f7f7",
            borderRadius: 8,
            color: "#666",
          }}
        >
          尚無案件，按右上角「新增案件」開始
        </div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #ddd", textAlign: "left" }}>
              <th style={{ padding: 8 }}>案件編號</th>
              <th style={{ padding: 8 }}>類型</th>
              <th style={{ padding: 8 }}>地址</th>
              <th style={{ padding: 8 }}>屋主</th>
              <th style={{ padding: 8 }}>狀態</th>
              <th style={{ padding: 8 }}>最後更新</th>
            </tr>
          </thead>
          <tbody>
            {cases.map((c) => (
              <tr
                key={c.id}
                style={{ borderBottom: "1px solid #eee", cursor: "pointer" }}
              >
                <td style={{ padding: 8 }}>
                  <Link
                    href={`/cases/${c.id}`}
                    style={{ color: "#0066cc", textDecoration: "none" }}
                  >
                    {c.case_no ?? c.id.slice(0, 8)}
                  </Link>
                </td>
                <td style={{ padding: 8 }}>{propertyTypeLabel(c.property_type)}</td>
                <td style={{ padding: 8 }}>{c.address}</td>
                <td style={{ padding: 8 }}>{c.owner_name ?? "—"}</td>
                <td style={{ padding: 8 }}>{statusLabel(c.status)}</td>
                <td style={{ padding: 8 }}>{formatTpeDate(c.updated_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
