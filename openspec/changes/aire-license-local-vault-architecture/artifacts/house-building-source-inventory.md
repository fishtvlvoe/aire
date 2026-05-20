# House Building Source Inventory

Date: 2026-05-20

Scope:

- Variant: 建物版 / 房屋版本
- First property type: 大樓華廈
- Goal: create the first development source matrix before UI, storage, and PDF work.

## Source Priority

Use these sources in this order unless a page contract says otherwise:

1. Registry/API result from protected local backend
2. Contract / signed委託資料
3. Field visit / 現場必問
4. Secretary supplement / 秘書後補
5. Public market/map data
6. Manual fallback input

## Source Files

| Source | Path | Use |
| --- | --- | --- |
| Building field master | `docs/0417-new/建安不動產欄位總表.md` and `建安不動產欄位總表_建物版.docx` | Canonical field list and source priority. |
| Field visit, first property type | `docs/0417-old/大樓華廈_現場必問清單.docx` | What the agent asks or records on site. |
| Secretary supplement | `docs/0417-old/大樓華廈_秘書後補清單.docx` | What office staff fills after委託/signature. |
| Formal disclosure visual pages | `0520/不動產說明書/3-2+3.JPG`, `4.JPG`, `5.JPG`, `6.JPG`, `7.JPG`, `8.JPG`, `9-8+9.JPG` | Official-style right preview and PDF layout references. |
| Field survey visual pages | `0520/不動產說明書/10-房屋-現況調查表-*.JPG` | Field condition questionnaire layout. |
| Living function visual page | `0520/不動產說明書/11-房屋-生活機能.JPG` | Surroundings/map/facility page layout. |
| MOI service catalog | `docs/cop-scrape/02-服務列表/merged_services.json` and `04-技術文件連結/document_links.json` | API service names, costs, and document references. |
| MOI token sample | `docs/MOIAPIExample_TOKEN/MOIAPIExample_Token/ApiHelper.cs` | Token request and Bearer API call model. |

## Workbench Split

Do not put all fields into one generic case form.

| Workbench | User job | Main sources | Output |
| --- | --- | --- | --- |
| Case Setup | Create/open property and pull registry data. | Minimal manual identity fields, MOI lookup services. | Case identity + registry payload. |
| Draft Disclosure | Produce first deliverable draft. | Registry, field master, manual known data, image slots. | Formal-style preview and draft PDF. |
| Formal Supplement | Fill/correct after signed委託. | Secretary supplement, contract, handwritten return data. | Final disclosure payload and PDF. |
| Field Survey | Record on-site facts and photos. | 大樓華廈現場必問清單, condition survey pages. | Survey payload that feeds disclosure. |
| Images / Maps | Manage upload/API images. | Manual upload in Basic; API sources in higher tiers. | Shared image slots used by preview/PDF. |

## First Field Matrix

Legend:

- Tier source: `Basic manual` means Basic users can enter/upload manually.
- `Pro/Advanced auto` means automation may be gated by entitlement, but the same output slot remains visible.
- Storage names are target concepts and still need implementation verification against current DB/local vault.

| Field group | Field | Primary source | Manual source | Storage target | Preview/PDF target | Entitlement behavior | API candidate |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Cover | Company logo | Settings / uploaded asset | User upload | `company_settings`, `case_assets` | Cover/header | Basic manual upload | none |
| Cover | Store/company/contact | Settings | Manual settings | `company_settings` | Cover/footer | Basic | none |
| Cover | Property id | Case setup | Manual | `cases` | Cover/header | Basic | none |
| Cover | Property name | Case setup | Manual | `cases` | Cover/title | Basic | none |
| Cover | Production date | System date | Manual override if needed | `disclosure_drafts` | Cover | Basic | none |
| Building basic | 建號 | 建物謄本 | Secretary supplement | `registry_payloads`, `disclosure_drafts` | 產權調查表 / 土地建物標示 pages | Basic registry pull | `MOI_API_015`, `MOI_API_036`, `MOI_API_004`, `MOI_API_026` |
| Building basic | 門牌地址 | Registry/field visit | 現場必問: 物件地址 | `cases`, `disclosure_drafts` | Basic info table | Basic manual; API lookup when available | `MOI_API_036`, `MOI_API_037` if eligible |
| Building basic | 權狀坪數 / 坪數 | 建物標示部 | Secretary supplement | `registry_payloads`, `disclosure_drafts` | 產權調查表 | Basic registry pull | `MOI_API_004`, `MOI_API_026` |
| Building basic | 主建物坪數 | 建物標示部 | Secretary supplement | `registry_payloads`, `disclosure_drafts` | 產權調查表 | Basic registry pull | `MOI_API_004`, `MOI_API_026` |
| Building basic | 附屬建物坪數 | 建物標示部 | Secretary supplement | `registry_payloads`, `disclosure_drafts` | 產權調查表 | Basic registry pull | `MOI_API_004`, `MOI_API_026` |
| Building basic | 共有部分坪數 / 公設 | 建物標示部 | Secretary supplement | `registry_payloads`, `disclosure_drafts` | 產權調查表 | Basic registry pull | `MOI_API_004`, `MOI_API_026` |
| Building basic | 樓層 / 總樓層 | Registry + field visit | 現場必問: 銷售樓別; 秘書後補核對 | `registry_payloads`, `disclosure_drafts` | 產權調查表 | Basic | `MOI_API_004`, `MOI_API_026` |
| Building basic | 格局 | Field visit / floor plan | Manual | `disclosure_drafts` | Basic info / field survey | Basic manual; Advanced floor-plan processing | none first, future floor-plan module |
| Community | 社區大樓名稱 | Field visit / community data | 現場必問 | `disclosure_drafts` | Basic info table | Basic manual | none |
| Community | 建設公司 | Field visit / registry if available | 現場必問 | `disclosure_drafts` | Basic info table | Basic manual | maybe `MOI_API_004` if present |
| Community | 總戶數 | Field visit | 現場必問 type field | `disclosure_drafts` | Community/management section | Basic manual | none |
| Community | 每層幾戶 | Field visit | 現場必問 | `disclosure_drafts` | Community/management section | Basic manual | none |
| Community | 電梯數 | Field visit | 現場必問 | `disclosure_drafts` | Community/management section | Basic manual | none |
| Community | 公設比 | Secretary supplement / calculation | Manual | `disclosure_drafts` | Community/management section | Basic manual/calculated | none |
| Management | 管理方式 | Field visit | 現場必問 | `disclosure_drafts` | 使用與管理 | Basic manual | none |
| Management | 管理費 | Field visit | 現場必問 / secretary supplement | `disclosure_drafts` | 使用與管理 | Basic manual | none |
| Management | 管理單位名稱 | Field visit | 現場必問 type field | `disclosure_drafts` | 使用與管理 | Basic manual | none |
| Use status | 用途 | Registry + field visit | 現場必問; secretary legal use check | `registry_payloads`, `disclosure_drafts` | 使用與管理 / risk | Basic | `MOI_API_004`, `MOI_API_026` |
| Use status | 現況 | Field visit | 現場必問 | `disclosure_drafts` | 使用與管理 | Basic manual | none |
| Use status | 租金 / tenant / lease | Field visit + contract | 現場必問; 秘書後補租客租期押金 | `disclosure_drafts` | 使用與管理 / formal supplement | Basic manual | none |
| Parking | 車位停車方式 | Field visit / registry | 現場必問 | `disclosure_drafts` | Basic info / parking section | Basic manual | `MOI_API_038` if eligible/needed |
| Parking | 車位號碼 | Field visit / registry | 現場必問 | `disclosure_drafts` | Basic info / parking section | Basic manual | `MOI_API_038` if eligible/needed |
| Parking | 車位權屬 | Secretary supplement / registry | Secretary supplement | `disclosure_drafts` | Parking/risk section | Basic manual | `MOI_API_004`, `MOI_API_026`, `MOI_API_038` |
| Parking | 車位是否獨立 | Secretary supplement | Manual | `disclosure_drafts` | Parking/risk section | Basic manual | `MOI_API_038` if eligible/needed |
| Rights | 所有權人 category | 建物所有權部 | Secretary supplement | `registry_payloads` | 產權調查表 | Basic registry pull; no cloud storage | `MOI_API_005` |
| Rights | 權利範圍 / 持分比例 | 建物所有權部 | Secretary supplement | `registry_payloads`, `disclosure_drafts` | 產權調查表 | Basic registry pull | `MOI_API_005` |
| Rights | 他項權利 / 抵押 | 建物他項權利部 | Secretary supplement | `registry_payloads`, `disclosure_drafts` | 產權調查表 / risk | Basic registry pull | `MOI_API_006`, `MOI_API_028` |
| Rights | 查封 / 限制登記 | Registry/right status | Secretary supplement | `registry_payloads`, `disclosure_drafts` | 產權調查表 / risk | Basic registry pull | `MOI_API_028` |
| Condition risk | 漏水 / 壁癌 | Field survey | Manual | `disclosure_drafts` | 現況調查表 / disclosure risk section | Basic manual | none |
| Condition risk | 增建 / 頂加 / 外推 / 夾層 | Field survey + secretary supplement | Manual | `disclosure_drafts` | 現況調查表 / formal supplement | Basic manual | none |
| Condition risk | 凶宅 / 事故 | Contract/field disclosure | Manual | `disclosure_drafts` | Legal/risk section | Basic manual; legal wording review | none |
| Legal update | 有無設置太陽光電發電設備 | Manual legal disclosure | Manual | `disclosure_drafts` | Legal/current-condition section | Basic manual first; automation TBD | none confirmed |
| Legal update | 太陽光電設備位置說明 | Manual legal disclosure | Manual | `disclosure_drafts` | Legal/current-condition section | Basic manual first; automation TBD | none confirmed |
| Legal update | 建築效能情形 | Manual legal disclosure | Manual | `disclosure_drafts` | Legal/current-condition section | Basic manual first; automation TBD | none confirmed |
| Legal update | 建築效能備註 | Manual legal disclosure | Manual | `disclosure_drafts` | Legal/current-condition section | Basic manual first; automation TBD | none confirmed |
| Transaction | 委託總價 | Field visit / contract | 現場必問 | `disclosure_drafts` | Transaction/tax pages | Basic manual | none |
| Transaction | 單價 | Calculation | Manual override | `disclosure_drafts` | Transaction/tax pages | Basic calculation | none |
| Tax | 土地增值稅 | Calculation / public value data | Manual | `disclosure_drafts` | Tax/cost pages | Basic manual; Pro/Advanced automation possible | `MOI_API_014`, tax formula module |
| Tax | 契稅 / 房屋稅 / 地價稅 | Calculation / manual | Manual | `disclosure_drafts` | Tax/cost pages | Basic manual; higher automation possible | `MOI_API_014` for land values where relevant |
| Surroundings | 最近學校 / 公園 / 市場 | Field visit / map research | 現場必問 | `disclosure_drafts` | 生活機能 page | Basic manual; Pro auto map/search | map/search providers, not MOI registry |
| Surroundings | 商圈名稱 / 交通條件 | Field visit / map research | 現場必問 | `disclosure_drafts` | 生活機能 page | Basic manual; Pro auto map/search | map/search providers |
| Market | 成交行情 / 透明房價 | Public market data | Manual upload/entry | `market_snapshots`, `disclosure_drafts` | 透明房價 / market pages | Basic manual; Pro/Advanced auto | existing real-price module |
| Images | 建物外觀照片 | Field photo upload | Manual upload | `case_assets` | Image slots / appendix | Basic manual upload | none |
| Images | 格局圖 | Upload / future generation | Manual upload | `case_assets` | Floor-plan slot | Basic manual; Advanced processing/generation | future floor-plan module |
| Images | 位置圖 / 周邊圖 | Upload / map API | Manual upload | `case_assets` | 生活機能 page | Basic manual; Pro auto | map API |
| Images | 地籍圖 | Upload / MOI WFS/WMS/API | Manual upload | `case_assets` | Cadastral slot | Basic manual; Pro auto | `MOI_WFS_001`, `MOI_WMS_002`, `MOI_API_023`, `MOI_API_024` |
| Images | 空拍圖 / 街景圖 | Upload / geo services | Manual upload | `case_assets` | Advanced appendix/visual pages | Basic manual upload; Advanced auto | existing geo services / external providers |

## First Page Contract Candidates

Build in this order:

1. `house.cover`
   - Reference: `docs/0417-old/不動產說明書1.pdf`, `0520/不動產說明書/1-封面.png`
   - Reason: confirms company identity, property id/name, signature blocks, production date.
2. `house.property_rights`
   - Reference: `0520/不動產說明書/3-2+3.JPG`
   - Reason: first core disclosure page.
3. `house.land_display`
   - Reference: `0520/不動產說明書/4.JPG`
   - Reason: registry/API-heavy page; must prove persistence and field mapping.
4. `house.field_survey.highrise`
   - Reference: `docs/0417-old/大樓華廈_現場必問清單.docx`, `0520/不動產說明書/10-房屋-現況調查表-*.JPG`
   - Reason: separates field survey UI from case setup and draft disclosure UI.
5. `house.living_function`
   - Reference: `0520/不動產說明書/11-房屋-生活機能.JPG`
   - Reason: shows the Basic-manual vs Pro-auto map/source distinction.

## Open Questions For Next Review

- Should `house.cover` be part of the MVP workbench, or generated automatically from case/company settings?
- For Basic plan, should registry pull include all basic building/land registry sections, or only the minimum謄本資料 needed by the first disclosure pages?
- Should market pages (`5.JPG`) be visible but marked manual in Basic, or hidden until Pro?
- Should field survey photos be stored as page-specific slots or global case assets with tags?
- Do we need OCR for old PDFs now, or are JPG/PDF visual references enough until the first renderer is built?
