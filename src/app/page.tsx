"use client";

// Task 1.2：Tauri ⇄ Next.js 整合 spike。
// 用 invoke('greet') 觸發 Rust 端命令，顯示回傳字串以驗證 IPC bridge 正常。

import { useEffect, useState } from "react";

export default function Home() {
  const [message, setMessage] = useState<string>("等待 Tauri IPC…");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 動態 import 避免 SSG 階段嘗試載入 Tauri runtime
    let cancelled = false;
    (async () => {
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        const result = await invoke<string>("greet", { name: "AIRE" });
        if (!cancelled) setMessage(result);
      } catch (err) {
        if (!cancelled) {
          // 在瀏覽器（非 Tauri）跑時會在這裡，spike 階段直接把錯誤顯示出來
          setError(err instanceof Error ? err.message : String(err));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main
      style={{
        padding: 24,
        fontFamily: "system-ui, sans-serif",
        lineHeight: 1.6,
      }}
    >
      <h1>AIRE</h1>
      <p>{message}</p>
      {error ? (
        <p style={{ color: "#b00020" }}>
          IPC 未啟用（你應該在 Tauri 視窗內開啟此頁）：{error}
        </p>
      ) : null}
    </main>
  );
}
