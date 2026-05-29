/**
 * 應用初始化：讀取運行時環境變數
 *
 * 在 app.tsx 或最頂層組件的 useEffect 調用。
 */

export async function initializeConfig() {
  try {
    const response = await fetch("/api/config");
    if (!response.ok) {
      console.error(`[config] API 失敗: ${response.status}`);
      return;
    }

    const config = await response.json();

    // 動態設定 window.__AIRE_LOCAL_TOKEN__
    if (config.token) {
      (window as any).__AIRE_LOCAL_TOKEN__ = config.token;
      console.log("[config] Token 已載入，長度:", config.token.length);
    } else {
      console.warn("[config] Token 為空");
    }

    // 其他配置可在此追加
    (window as any).__AIRE_ENV__ = config.env;
    console.log("[config] 環境:", config.env);
  } catch (err) {
    console.error("[config] 初始化失敗:", err);
  }
}
