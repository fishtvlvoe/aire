## Problem

Fish 手動建立 `0005` 案件並提供屋主授權與所有權人姓名後，輸出的 `0005-說明書.pdf` 仍幾乎沒有正式謄本資料、街景圖、空拍圖與完整法規內容。這份 PDF 不能用來交付客戶。

已查到的現象：

- `pdfimages -list /Users/fishtv/Downloads/0005-說明書.pdf` 顯示 0 張圖片，代表街景與空拍圖沒有被嵌入 PDF。
- `pdftotext` 只看到地址、屋主姓名、地號 `0001` 與「尚未取得正式建物所有權資料」；建物面積、用途、建築完成日、樓層、權利範圍、權狀字號、登記日期等正式欄位都是空的。
- PDF 仍只有少量法規告知文字，設定頁品牌/經紀資訊也沒有完整回填到封面與簽章欄。
- 兩個不同瀏覽器在 `localhost:3000` 看到的案件與補件狀態不一致，因 dev browser path 使用各自瀏覽器的 localStorage mock store，不是共用 SaaS 後端資料。
- 「地政匯入資料」可看到需人工提供、待資料或查詢未成功，但沒有把這些缺口轉成可填寫、可儲存、可回填 PDF 的補件欄位。

## Root Cause

目前流程把「地址判斷」錯當成「正式地政資料已查詢」：

1. `/cases/new` 的地政判斷只呼叫地址 lookup，建立案件時把候選資料存成 `land_registry_data`。
2. 該 payload 來源是 `public_candidate`，且 `building_ownership` 被寫成 failed：`尚未取得正式建物所有權資料...`。
3. `assembleDossierData()` 只要看到案件已有 `land_registry_data`，就不再呼叫 `land_registry_pull_data` 正式拉謄本。
4. 因此有屋主授權與姓名時，正式 API 也被跳過，PDF 只能拿到候選地號與案件表單欄位。
5. 一般瀏覽器 dev path 會 fallback 到 mock backend，不能證明 native/Tauri 真 API、圖資 IPC 與正式 PDF 匯出可交付。

文字圖：

```
目前錯誤流程
地址 lookup -> 存 public_candidate -> PDF 看到已有 land_registry_data -> 不打正式 API -> PDF 空白

應修正流程
地址 lookup -> 建立候選案件 -> 屋主授權 + 姓名 -> 正式 pull_data -> 存 trusted registry -> PDF 完整輸出
```

## Proposed Solution

- 新增授權後正式地政 pull 流程：有屋主授權與所有權人姓名時，必須呼叫正式 `land_registry_pull_data`，不得只用地址候選資料產 PDF。
- 修正 PDF assembly fallback：若 persisted `land_registry_data` 只有 candidate/failed，PDF 組裝必須嘗試正式 API 或明確顯示「尚未正式查詢」，不得把候選 payload 當終局資料。
- 修正案件新增/物件審核資料模型：候選資料與正式謄本資料分層保存，避免 candidate 覆蓋 trusted payload。
- 修正圖資輸出：位置圖、街景/外觀、空拍圖有資料時必須進 PDF；無資料時保留空白框並標示可補件，不得默默沒有圖片。
- 補齊設定頁品牌/經紀欄位：承辦人、經紀人、經紀人證號、不動產業者、經紀業者編號、公司地址、公司電話，並回填封面與簽章欄。
- 將上述品牌/經紀欄位定義為全域交付設定，而不是每案資料；它們 SHALL 在系統設定中有清楚入口，欄位名稱與 PDF 名稱一致，儲存後套用所有案件。
- 補齊法規內容來源與 PDF 呈現，不能只輸出目前少量 hardcoded 條文。
- 將資料來源缺口轉成可操作補件：每個「需人工提供／待資料／查詢未成功」欄位都要能在工作台填值、標註來源、儲存、回填預覽與 PDF。
- 明確處理 browser dev mock 邊界：若仍使用 localStorage mock，UI 必須顯示「本瀏覽器本機測試資料」；正式驗收必須走 native/共享後端，不可把兩個瀏覽器不一致當成產品資料同步成功。
- 以 `0005` 類似情境做驗收：地址、屋主姓名、授權、正式 API 回傳、PDF 圖資與法規都必須可驗證。

## Non-Goals

- 不重新設計目前 UI/UX 骨架；只修資料流、設定欄位、PDF 完整性與驗收。
- 不承諾地政 API 無法依法提供的個資欄位會被查出；但系統必須把有權限可查、API 已回傳、使用者已提供的資料完整呈現。
- 不把 mock/browser 成功當成交付證據；release 驗收必須包含 native/Tauri 或 backend 真路徑。

## Success Criteria

- 有屋主授權與姓名的案件，按正式地政查詢後，`land_registry_data` 內有 trusted `moi_api` entries，且 PDF 使用 trusted 資料。
- 若只有 `public_candidate`，PDF 不得短路正式 API；必須嘗試正式 pull 或阻擋為「尚未正式查詢」狀態。
- `0005` 類似案件輸出的 PDF 不再只有地號 `0001`；可查得欄位、實價登錄、圖資、法規、公司/經紀欄位都能呈現或有明確補件狀態。
- 需人工提供的欄位在工作台有可填表單；填入後同一案件的預覽與 PDF 會使用該補件值，且標示來源為人工/屋主提供。
- 設定頁可一次設定並保存承辦人、經紀人、經紀人證號、不動產經紀業、經紀業證號、公司地址、公司電話；之後新增案件與既有案件 PDF 都讀取這份全域設定。
- `pdfimages -list` 對有圖資的 PDF 會看到圖片物件；無圖資時 PDF 有空白框與補件說明。
- `spectra analyze fix-authorized-registry-pdf-completeness --json` clean，`spectra validate fix-authorized-registry-pdf-completeness` 通過。

## Impact

- Affected code:
  - Modified: `src/app/(dashboard)/cases/new/page.tsx`
  - Modified: `src/app/(dashboard)/cases/[id]/preview/page.tsx`
  - Modified: `src/components/PullParcelDataButton.tsx`
  - Modified: `src/components/workbench/DemoAlignedWorkbench.tsx`
  - Modified: `src/app/(dashboard)/settings/page.tsx`
  - Modified: `src/lib/pdf-engine/assemble-dossier-data.ts`
  - Modified: `src/lib/pdf-engine/document.tsx`
  - Modified: `src/lib/pdf-blocks/`
  - Modified: `src/lib/registry-provenance.ts`
  - Modified: `src/lib/branding-api.ts`
  - Modified: `src-tauri/src/land_registry/`
  - Modified: `src-tauri/src/branding/`
  - Modified: `src-tauri/src/legal_clauses/`
  - New: `e2e/authorized-registry-pdf-completeness.spec.ts`
  - New: `openspec/changes/fix-authorized-registry-pdf-completeness/`
