# align-product-ui-with-demo-reference — 收驗內容

## 收驗目標

AIRE 正式產品的前台案件工作台、後台系統設定、demo reference、測試與 Spectra gate 必須一致。不能只用 build 成功當完成；必須留下可重跑的測試命令與瀏覽器截圖。

## 收驗範圍

| 區域 | 必須驗收的內容 | 對應檔案或路由 |
|---|---|---|
| Demo reference | 工作台與設定 demo 可開啟，並包含本 SR 指定的標題、分類、欄位區塊 | `UI-UX-DEMO-REFERENCE/registry-autofill-workbench.html`、`UI-UX-DEMO-REFERENCE/registry-autofill-settings.html` |
| 前台工作台 | 案件主路由是「說明書工作台」，左欄為案件與章節，右欄為欄位審核、資料來源、補件、費用、PDF 檢查 | `/cases/[id]` |
| 前台新增案件 | 先輸入地址，再由地政判斷土地、建物、農舍；查不到或多筆候選才顯示人工物件類型 | `/cases/new` |
| 主導覽 | 側欄為資料夾式一級選單與子選單，保留收合與個人設定入口 | `src/components/AppSidebar.tsx` |
| 後台設定 | 授權與升級、地政資料規則、費用與帳務、PDF 圖資欄位、地政授權集中在設定，不常駐工作台 | `/settings` |
| 後台端口 | 保留授權、地政 API key、升級、dev-only feature flags，不因 UI 改版消失 | `LicenseSection`、`LandApiSection`、`PremiumUnlockSection`、`DevSuperAdmin` |
| 前台文案 | 客戶畫面不得顯示 `MOI_API_`、`COP309`、`BASIC`、`pro`、`advanced`、backend enum | unit tests + Playwright text checks |
| 視覺驗收 | 1440px、1024px、768px 都要截 demo 與產品頁，檢查 sidebar、兩欄、settings、toggle、文字不重疊 | `e2e/results/demo-alignment/*.png` |

## 必跑驗收命令

```bash
pnpm test src/lib/__tests__/product-ui-demo-alignment.test.ts src/components/__tests__/AppSidebar.test.tsx src/components/__tests__/DemoAlignedWorkbench.test.tsx 'src/app/(dashboard)/settings/__tests__/settings-page.test.tsx' 'src/app/(dashboard)/settings/__tests__/page.test.tsx' 'src/app/(dashboard)/cases/new/__tests__/new-case-page.test.tsx' src/components/__tests__/SettingsTabs.test.tsx src/components/settings/__tests__/LandApiSection.test.tsx src/components/settings/__tests__/LandApiSection-toast.test.tsx
pnpm type-check
E2E_BASE_URL=http://localhost:3000 pnpm exec playwright test e2e/product-ui-demo-alignment.spec.ts e2e/aire-disclosure-registry-ux.spec.ts --project=chromium-tauri
pnpm build
spectra analyze align-product-ui-with-demo-reference --json
spectra validate align-product-ui-with-demo-reference
```

## 通過條件

- 所有命令 exit code 必須為 0。
- `spectra analyze` 不得有 Critical 或 Warning。
- Playwright 必須產出 demo/product 對照截圖。
- `/cases/[id]` 不得回到舊 wizard；舊流程只允許在 `/cases/[id]/legacy`。
- `/settings` 必須同時看到 demo 分類與既有後台設定端口。
- 前台工作台與設定頁不得出現工程代碼或英文方案 enum。
