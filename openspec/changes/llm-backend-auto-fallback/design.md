## Context

`src/lib/codex-client/index.ts` 目前在 module 載入時鎖死單一 adapter（`const activeAdapter = adapters[activeBackend]`），`runCodex()` 直接呼叫 `activeAdapter.run()` 不做任何探針或備援。每個 adapter 都已有 `check(): Promise<CodexStatus>` 方法可用，但從未被 `runCodex()` 呼叫。

## Goals / Non-Goals

**Goals**
- `runCodex()` 在首選 backend 不可用時自動切換
- 保持現有 `LlmAdapter` 介面不變（每個 adapter 無需修改）
- 每次呼叫都是無狀態探針（不快取 backend 健康狀態）

**Non-Goals**
- 不實作 backend 健康狀態快取
- 不為 `runVision()` 實作 fallback
- 不改變 `.env.local` 的 `LLM_BACKEND` 語意

## Decisions

**決策 1：每次 runCodex() 重新 check，不快取**

理由：文件生成是低頻操作（每筆物件幾分鐘一次），探針開銷可忽略；快取反而增加複雜度，且 429 狀態是暫時的，重新 check 更準確。

**決策 2：fallback 順序固定，不可由 env 全自訂**

fallback 順序：`[preferred, "gemini", "codex", "claude-code", "ollama"]` 去重。`LLM_BACKEND` 只決定首選，其餘固定，避免設定爆炸。

**決策 3：只有 check() 不通 或 run() 回 quota-exceeded 時才 fallback**

其他錯誤（`error` 狀態）代表 prompt 本身有問題或系統異常，直接回傳，不繼續嘗試。

## Implementation

### `src/lib/codex-client/types.ts`

`CodexResult` 新增欄位：
```typescript
usedBackend?: string | null;
```

### `src/lib/codex-client/index.ts`

移除 module-level `activeAdapter` const，改為：

```typescript
function buildFallbackChain(preferred: LlmBackend): LlmBackend[] {
  const base: LlmBackend[] = ["gemini", "codex", "claude-code", "ollama"];
  return [preferred, ...base.filter(b => b !== preferred)];
}

export async function runCodex(prompt, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const chain = buildFallbackChain(resolveBackend(process.env.LLM_BACKEND));
  for (const backend of chain) {
    const status = await adapters[backend].check();
    if (status !== "ready") continue;
    const result = await adapters[backend].run(prompt, timeoutMs);
    if (result.success) return { ...result, usedBackend: backend };
    if (result.status === "quota-exceeded") continue;
    return { ...result, usedBackend: backend }; // 其他錯誤直接回
  }
  return { success: false, error: "All LLM backends failed", status: "error", usedBackend: null };
}
```

`checkCodexStatus()` 保持不變（仍用 preferred backend check）。

### `src/app/api/listings/[id]/generate/route.ts`

`generateSingle()` 回傳後，將 `usedBackend` 帶入 response JSON：
```typescript
return NextResponse.json({ ok: true, documentType, document: result, usedBackend });
```

## Implementation Distribution

| 工作項 | 工具 | 原因 |
|-------|------|------|
| 修改 types.ts、index.ts、route.ts | Copilot CLI | 業務邏輯修改，< 50 行 |
| 寫 fallback-chain.test.ts | Copilot CLI | 單元測試，mock adapter |
