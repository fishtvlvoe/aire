## Problem

裕農路真實地址驗收顯示，AIRE 目前只串接 COP 的門牌查建號鏈路，沒有實作國土測繪中心 CAD_009 指定門牌查詢地號與 CAD_011 指定地號查詢建號列表。使用者以為 CAD_009/CAD_011 已經串好，但程式碼與文件搜尋都沒有 client、IPC command 或測試覆蓋。

最小 live probe 已確認官方端點存在，但目前未開通：

- CAD_009: https://api.nlsc.gov.tw/idc/AddressQueryLand/台南市東區裕農路288巷17號8樓之1/10 回 HTTP 404 與 PERMISSION DENIED
- CAD_011: https://api.nlsc.gov.tw/dmaps/CadasLandInfo/D/1556/00700000 回 HTTP 404 與 PERMISSION DENIED

## Root Cause

現有地址查詢只透過 `src-tauri/src/land_registry/apis/address_to_parcel.rs` 的 COP `/BuildingNo/1.0/QueryByAddress`。當 COP 回 COP317 未開通時，系統沒有可觀測的 NLSC CAD 備援嘗試，也沒有把 CAD 權限不足分類成可理解的 blocked state。

## Proposed Solution

建立最小可測的 NLSC CAD 備援層：

- 新增 CAD_009/CAD_011 client 與 parser，只在明確啟用 NLSC 來源時呼叫。
- 將 `PERMISSION DENIED` 與 HTTP 404 分類成 `permission_denied`，不得當成查無資料。
- 地址查詢流程先走 COP；COP 未授權或無結果時，可嘗試 NLSC CAD_009，再用 CAD_011 補建號列表。
- 回傳結果必須標示 `source = "nlsc_cad"` 與 `trustedForPdf = false`，直到後續正式地政謄本 API 或人工確認完成，不可直接寫入正式 PDF。
- 保留最小 live probe 測試，讓我們能確認目前環境是權限不足而不是代碼沒打。

## Non-Goals

- 不繞過國土測繪中心申請、IP 綁定或授權限制。
- 不把 NLSC 地籍圖資查詢結果視為謄本資料。
- 不用候選資料自動填入正式 PDF。
- 不處理付費或申請文件流程，只在 UI/錯誤狀態提示需要申請。

## Success Criteria

- CAD_009/CAD_011 有可執行 client 單元測試與 live ignored probe。
- 權限不足時顯示明確 blocked state，而不是假裝查無資料。
- 地址查詢可區分 COP、NLSC CAD、manual 的來源。
- PDF provenance guard 保持有效，NLSC CAD 資料不直接進正式 PDF。
- SR gate 通过 `spectra analyze add-nlsc-cadastral-fallback-probe --json` 與 `spectra validate add-nlsc-cadastral-fallback-probe`。

## Impact

- Affected specs:
  - land-registry-address-lookup
- Affected code:
  - Modified: src-tauri/src/land_registry/apis/mod.rs
  - Modified: src-tauri/src/land_registry/apis/address_to_parcel.rs
  - Modified: src-tauri/src/land_registry/pull.rs
  - Modified: src/lib/land-registry-api.ts
  - New: src-tauri/src/land_registry/apis/nlsc_cadastral.rs
  - New: src-tauri/tests/nlsc_cadastral_yunong_live.rs
  - New: docs/land-registry-nlsc-cad-probe.md
  - Removed: none
