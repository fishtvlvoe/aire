# SPEC-001: 身份驗證與角色存取控制

| 欄位 | 值 |
|------|-----|
| **版本** | v0.1 |
| **狀態** | Draft |
| **作用域** | 登入流程、session 管理、路由保護、權限驗證 |
| **相關文件** | ADR-001 (SQLite vs Cloud), SPEC-002 (audit-trail) |

## 概述

目前系統全開放無身份驗證，任何人可存取所有功能。本 SPEC 定義使用者登入、session 管理、角色型存取控制 (RBAC)，以及受保護路由的完整合約。

## 需求

### 需求 1: 使用者登入及 Session 管理

系統 **應提供** 使用者登入端點，經驗證後建立安全 session，並 **應防護** 所有頁面須先登入才可存取。

#### 場景 1.1: 成功登入

- **當**：業務人員在登入頁輸入有效帳號密碼，點擊「登入」
- **則**：系統驗證帳號密碼
- **且**：系統建立 httpOnly session cookie，設 max-age 為 8 小時
- **且**：系統導向首頁
- **且**：首頁正常渲染，無重導至登入頁

#### 場景 1.2: 登入失敗 - 帳號不存在

- **當**：輸入不存在的帳號
- **則**：系統返回 401，顯示「帳號或密碼錯誤」
- **且**：session 不被建立

#### 場景 1.3: Session 過期

- **當**：使用者登入超過 8 小時，再次訪問頁面
- **則**：系統檢驗 cookie，發現過期
- **且**：系統重導至登入頁
- **且**：重導前可選顯示「您的登入已過期，請重新登入」提示

#### 場景 1.4: 登出

- **當**：使用者點擊「登出」
- **則**：系統清除 session cookie
- **且**：系統重導至登入頁

### 需求 2: 角色與權限

系統 **應支援** 最少三個角色：管理員 (admin)、業務代理 (agent)、檢視者 (viewer)，各角色對應不同功能權限。

| 角色 | 可建立列表 | 可編輯列表 | 可刪除列表 | 可查看報告 | 可匯出資料 |
|------|----------|---------|---------|---------|----------|
| **admin** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **agent** | ✅ | ✅ (自己的) | ❌ | ✅ (自己的) | ✅ (自己的) |
| **viewer** | ❌ | ❌ | ❌ | ✅ (唯讀) | ❌ |

#### 場景 2.1: 權限檢驗 - 業務代理無法刪除

- **當**：業務代理點擊「刪除列表」按鈕
- **則**：系統檢驗使用者角色
- **且**：系統隱藏刪除按鈕，或返回 403 Forbidden

#### 場景 2.2: 權限檢驗 - 檢視者無法編輯

- **當**：檢視者試圖編輯任何欄位
- **則**：系統返回 403，顯示「您無此權限」

### 需求 3: 路由保護

系統 **應防護** 所有 `/listings`, `/documents`, `/api/listings` 等受保護路由，未登入或權限不足時返回 401/403。

#### 場景 3.1: 未登入存取受保護路由

- **當**：未登入使用者直接訪問 `GET /listings`
- **則**：系統重導至登入頁，或返回 401

#### 場景 3.2: 受保護 API 無有效 token

- **當**：第三方工具發送 `POST /api/listings` 但無 session/token
- **則**：系統返回 401 `{ error: "Unauthorized" }`

## DTO 定義

| DTO 名稱 | 用途 | 關鍵欄位 | 型別 | 備註 |
|---------|------|--------|------|------|
| `LoginRequest` | 登入要求 | `username`, `password` | string | 最少 6 字元 |
| `LoginResponse` | 登入回應 | `success`, `message`, `user` | boolean, string, User | 失敗時 user 為 null |
| `User` | 使用者物件 | `id`, `username`, `role`, `email`, `createdAt` | uuid, string, enum, string, timestamp | role: admin / agent / viewer |
| `SessionCookie` | Session cookie | `sessionId`, `userId`, `expiresAt` | string, uuid, timestamp | httpOnly 標記 |

### 範例

```typescript
// LoginRequest
{
  "username": "john.agent@example.com",
  "password": "securePassword123"
}

// LoginResponse (success)
{
  "success": true,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "john.agent@example.com",
    "role": "agent",
    "email": "john.agent@example.com",
    "createdAt": "2026-04-01T10:00:00Z"
  }
}

// LoginResponse (failure)
{
  "success": false,
  "message": "帳號或密碼錯誤",
  "user": null
}
```

## 業務規則

1. **密碼要求**：最少 8 字元，包含大小寫英文字母、數字、特殊符號
2. **Session 有效期**：8 小時；可選支援「記住我」延長至 30 天
3. **登入嘗試限制**：連續 5 次失敗後鎖定帳號 15 分鐘
4. **密碼重設**：使用者可透過註冊信箱重設，有效期 1 小時
5. **角色分配**：初始建立時由 admin 分配；使用者無法自行更改

## Changelog

| 版本 | 日期 | 變更 |
|------|------|------|
| v0.1 | 2026-04-27 | 初版草稿 |

---

> retrofit 產生於 2026-04-27，來源：openspec/changes/ archived changes 反向萃取
