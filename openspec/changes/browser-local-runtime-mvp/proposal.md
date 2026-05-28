# browser-local-runtime-mvp

## Summary

建立一條不依賴 Tauri / Rust 的 Windows-first MVP 交付路線：客戶安裝 AIRE 後，桌面捷徑啟動一個本機 Node/Next.js standalone runtime，服務只綁定 `127.0.0.1`，並自動開啟系統預設瀏覽器使用 AIRE。客戶不需要安裝 Node、不需要 repo、不需要 terminal，資料留在本機。

## Problem

目前 AIRE 的桌面 App 路線把 Web 與 App 分成多個 runtime：本機 Web 走 Next API route，桌面 App 又有 Tauri/Rust IPC。這造成「本機 Web 可以，但 App 壞掉」以及「改 A 壞 B」。客戶真正需要的是 Windows 能安裝、能穩定查地址/COP、資料不進雲端，而不是一定要有原生 App 視窗。

## Goals

- 產出 Windows 安裝器，安裝後提供 AIRE 桌面捷徑。
- 捷徑啟動本機 runtime，綁定 `127.0.0.1`，自動開啟瀏覽器。
- 打包 Node 官方 runtime 與 Next standalone 產物，客戶本機不需原始碼或開發工具。
- 案件資料、COP API 設定、上傳檔案、PDF 產物預設保存在本機資料目錄。
- PDF 由 Node 端完整產出（草稿與說明書為同一份文件的兩個產出時間點），取代原 Rust `export_pdf`。
- MVP 驗收包含：登入/啟動、COP 帳密保存、地址查地段/地號/建號、正式資料匯入、案件保存、草稿與說明書 PDF 產出、重開後資料存在。

## Non-Goals

- 不做 Tauri/Rust App shell。
- 不做 Electron/Chromium 打包。
- 不做雲端 SaaS 儲存客戶案件資料。
- 不在本 change 解決 Windows code signing / SmartScreen；若要客戶正式大量發佈，另開 signing release change。

## Expected Outcome

這條路線成功後，AIRE MVP 的交付型態會是「本機安裝 + 系統瀏覽器使用 + 本機資料」，避免 Web/App 分裂。若客戶後續需要更像 App 的視窗體驗，再評估 Electron 或 WebView shell。
