## Context

裕農路驗收已證明：地址正確不代表 COP 或地址反查可以直接回傳正式、唯一、完整的建物資料。業務真正需要的是「去跟屋主談之前有基本房屋資料」，不是在正式謄本取得前讓 PDF 幾乎全空。

本 CR 把前期洽談 PDF 定義成參考物調表：有可靠來源就填，有候選或推測就標來源後填，無可靠來源就留白，方便列印後手寫補件。

## Goals / Non-Goals

**Goals:**

- 讓裕農路這類地址在正式謄本前仍能產出可洽談 PDF。
- 將資料來源固定分為正式資料、候選資料、推測資料、留白欄位。
- 讓可查或可合理推測的欄位先出現在 PDF，不因缺正式所有權資料而整份空白。
- 讓不可推測欄位保持空白，不塞「尚待正式謄本或屋主權狀確認」。
- 讓每個候選或推測值都保留來源標記與正式謄本聲明。

**Non-Goals:**

- 不做電子謄本官方網站自動申請或代登入。
- 不保證 COP API 能拿到正式謄本等級資料。
- 不把候選或推測資料用於正式交付狀態。
- 不新增 database schema；沿用既有 `land_registry_data` provenance JSON。

## Decisions

### Decision: Treat the pre-owner-talk dossier as a separate trust mode

前期洽談版不是正式說明書完成版。PDF 可以使用 candidate 與 inferred reference，但必須標示來源並保留固定聲明。

Alternatives Considered:

- 等正式謄本才輸出：業務無法在委託前洽談，因此否決。
- 把候選資料當正式資料：有錯戶風險，因此否決。

### Decision: Leave unreliable formal-rights fields blank

正式所有權取得日期、權狀字號、抵押權、他項權利、擔保金額、存續期間等欄位若沒有正式謄本或屋主權狀，不顯示提示文字，保持空白。

Alternatives Considered:

- 顯示「尚待正式謄本或屋主權狀確認」：列印後不利手寫補件，且 Fish 已明確要求留白，因此否決。
- 從候選或實價登錄推測他項權利：資料性質錯誤，因此否決。

### Decision: Auto-use single land candidate for pre-survey reference

當地址查詢只有一筆土地候選時，dossier assembly 可把它當作前期參考來源，填入地段、地號、使用分區、土地面積、建蔽率與容積率。這不代表正式確認，只是避免可用土地資料被漏掉。

Alternatives Considered:

- 必須人工暫用土地候選才填：在只有一筆土地候選時造成不必要空白，因此否決。

## Implementation Contract

資料優先序：

1. 正式資料或人工確認資料。
2. selected candidate。
3. inferred reference。
4. 單一 land candidate。
5. 無可靠來源則留白。

可填的前期參考欄位：

- 土地：地段、地號、使用分區、土地面積、建蔽率、容積率、土地持分與持分面積。
- 建物：登記坪數、主建坪數、附屬建物、公共設施/共有部分、車位坪數、法定用途、主要建材、建築完成日、屋齡、樓層、建物權利範圍。
- 周邊：附近實價登錄、位置圖、航拍圖、建物外觀、生活機能。

必須留白的無可靠來源欄位：

- 取得日期。
- 權狀字號。
- 正式所有權及他項權利細節。
- 他項權利種類。
- 擔保金額。
- 存續期間。
- 抵押權設定內容。

Failure modes:

- COP317/COP312/COP305：保留候選清單與錯誤碼，不讓 PDF 整份空白。
- 無任何候選：PDF 保持現有空白行，讓使用者手寫補件。
- 圖資無座標：顯示缺圖原因，不使用 logo 或假圖。

Acceptance criteria:

- 裕農路地址匯出的 PDF 包含候選或推測的土地、建物、實價登錄與圖資內容。
- 無正式權利資料時，取得日期、他項權利、抵押權相關欄位保持空白。
- PDF 每個候選或推測值都有來源標示。
- 固定聲明出現在候選或推測版 PDF。
