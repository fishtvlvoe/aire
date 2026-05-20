# AIRE 不動產說明書交付分析

> 日期：2026-05-20  
> 目的：整理目前 AIRE 產出不動產說明書的真實狀態，作為 `floor-plan-assets-bridge` SDD 的前置分析。

## 結論

AIRE 目前不是缺少 PDF renderer，而是格局圖資料來源與匯出鏈需要收斂。現況已有三條格局圖流並存：Step 3 直傳 raster 圖、現場手稿轉 SVG、以及尚未實作的 `case_assets` 多圖資產模型。若直接實作完整多圖資產管理，會讓 PDF 出現多頁格局圖，也會讓審核規則在三個資料來源之間分裂。

本輪採用「漸進統一」：先建立 `case_assets` bridge，讓新上傳 raster 格局圖寫入本機資產表，PDF 組裝優先讀取 `case_assets`，舊案件仍 fallback 讀 `land_registry_data.floor_plan_photo`。現場手稿 SVG 暫時維持既有審核流，下一個 SDD 再合流。

## 目前三條格局圖流

| Flow | 現況 | 儲存位置 | PDF 行為 | 風險 |
| --- | --- | --- | --- | --- |
| Step 3 直傳圖 | 已有 UI 與 PDF 頁 | `land_registry_data.floor_plan_photo` JSON | `FloorPlanPhotoPage` | JSON 欄位塞 base64，不適合作為長期資產模型 |
| 現場手稿轉 SVG | 已有 sketch/conversion table 與 approved 流程 | `floor_plan_sketches` / `floor_plan_conversions` | `FieldSketchFloorPlanPage` | 與直傳圖可能同時出現在 PDF |
| 多圖資產管理 | Spectra 設計中，尚未實作 | 預計 `case_assets` | 預計 approved primary 才輸出 | 若直接全做，會擴大範圍與重複 PDF 頁 |

## opcOS / SaaS 架構理解

`docs/opcos-saas` 的架構方向是用 Supastarter/opcOS 做長期 SaaS 底盤，讓 AIRE、anismile、PostGo、FlowGo 等子服務共用 auth、payments、ui、database、ai、storage 等 packages。AIRE 目前仍是本機桌面 App，核心原因是屋主與謄本資料不能上雲，因此這輪不把 Supastarter storage 或多租戶能力搬進桌面版。

對 AIRE 這次交付最重要的 opcOS 原則是 reuse-first 與 local-first：能復用既有 PDF engine、Tauri IPC、SQLite migration 與 mock backend，就不新建雲端路徑；需要資產模型時，也先落在本機 app data + SQLite metadata。

## 交付缺口

1. 新上傳格局圖仍寫在 `land_registry_data.floor_plan_photo`，不是可審核、可擴充的資產模型。
2. `assemble-dossier-data` 需要一個穩定優先序：`case_assets` → 舊 JSON fallback → empty placeholder。
3. 預覽頁桌面匯出路徑需要符合 Rust `export_pdf` command 的 `pdfBytes + outputPath` 合約。
4. PDF 應避免同一份說明書出現多個互相競爭的格局圖主頁。
5. 缺圖與缺欄位不能讓 PDF fail；應顯示「待補」或清楚 placeholder。

## SDD 路線

### SR-A：floor-plan-assets-bridge

先建立 `case_assets` 本機資產模型，讓 Step 3 raster 圖從 JSON 欄位搬到資產表，PDF 產出不退化。完成標準是：舊案件格局圖不消失，新上傳走 `case_assets`，PDF 仍只出一頁直傳格局圖/土地規劃圖，匯出 PDF 可正常寫檔。

### SR-B：floor-plan-assets-and-ai-schematic follow-up

在 bridge 穩定後，再實作多圖列表、pending/approved/rejected、primary asset、AI schematic brief、外部工具來源 metadata，以及現場手稿 SVG 與 asset model 合流。
