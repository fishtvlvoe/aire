<!--
Each task description MUST state:
- the behavior or contract being delivered, and
- the verification target that proves completion.
-->

## 1. HTML Blueprint

- [x] 1.1 實作 Requirement: Standalone blueprint document、design goals/non-goals 與 decision 1: use a standalone html report，新增 `docs/aire-desktop-system-blueprint-2026-05-25.html`，讓文件可離線直接開啟，且不做產品頁、不新增 runtime dependency、不要求 dev server；以檔案存在、無外部資源依賴與瀏覽器開啟驗證。
- [x] 1.2 實作 Requirement: Audit-report visual language 與 decision 2: match the audit-report visual language，套用 anismile audit 頁的深色報告、metric cards、tags、tables、flow diagrams 與 callout boxes；以 HTML/CSS 檢查與截圖驗證。
- [x] 1.3 實作 Requirement: Complete AIRE flow map 與 decision 4: document sequence, not implementation，內容涵蓋物件、流程、授權方式、OO 串接、驗收、自動更新、斷點與紀錄，並明確呈現 Desktop fullflow 與 macOS/Windows 驗收早於 auto-update；以文字掃描驗證必要章節都存在。
- [x] 1.4 實作 Requirement: Customer and engineering language are separated 與 decision 3: separate customer language and engineering language，頁面明確區分客戶可見任務語言與內部工程詞；以內容檢查驗證 R02、COP、JSON、Tauri 等詞只作內部藍圖說明。

## 2. SDD Handoff

- [x] 2.1 實作 Requirement: Blueprint is discoverable from SR index，更新 `openspec/SR-ACTIVE-INDEX.md`，讓接手者知道此 HTML 是流程藍圖入口；以檔案內容檢查驗證。
- [x] 2.2 跑 Spectra consistency gate；以 `spectra analyze desktop-system-flow-blueprint-html --json` 0 Critical/0 Warning 與 `spectra validate desktop-system-flow-blueprint-html` 通過驗證。
