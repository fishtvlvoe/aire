# ADR-002: LLM 多後端適配 (Adapter Pattern)

| 欄位 | 值 |
|------|-----|
| **決策日期** | 2026-04-18 |
| **狀態** | Accepted |
| **相關文件** | llm-backend-adapter spec, container-deployment |
| **影響範圍** | LLM 呼叫層、環境設定、成本管理 |

## 背景

文件生成的核心是 LLM 推論（OCR 結果 + 使用者資料 → 5 份文件內容）。目前系統假設使用 Codex，但實際需求：
- **成本控制**：Gemini 免費額度充足（初期開發），Claude Code 性能最優（生產）
- **可用性**：若 Codex 維護，應快速切換至備用後端
- **靈活測試**：不同表單邏輯用不同 LLM 測試效果

目前每個後端整合都要修改 `document-generator.ts`，添加新後端需改業務邏輯，維護成本高。

## 考慮選項

### 選項 A — 鎖定單一後端（Codex）

**優點**：
- 實作簡單，無抽象層

**缺點**：
- 無備用方案
- 成本無法優化
- 遷移困難

### 選項 B — 硬編碼所有後端邏輯（if-else 大型分支）

**優點**：
- 無需架構設計

**缺點**：
- 程式碼難以維護（後端增加時改動風險高）
- 每個 prompt 需重複定義 4 次（1 個給每個後端）
- Bug 修復難以同步

### 選項 C — Adapter Pattern（後端介面統一） ✅ **選中**

**優點**：
- ✅ 介面統一：所有後端實現 `{ prompt, context } → { text, usage }`
- ✅ 外部化選擇：環境變數 `LLM_BACKEND` 決定後端，無需改代碼
- ✅ 易於擴展：新增後端只需實現新的 Adapter
- ✅ 單一責任：各 adapter 獨立維護 prompt / token 計數
- ✅ 測試容易：可 mock 各後端獨立測試

**缺點**：
- 初期設計投入較多
- 各後端 prompt 略有差異，需人工調適

## 決策

**採用 Adapter Pattern**：統一 LLM 呼叫介面，後端由環境變數選擇。

### 實施細則

**介面定義** (`src/lib/codex-client/types.ts`):

```typescript
export interface CodexAdapter {
  name: string;  // "codex" | "claude-code" | "gemini" | "ollama"
  
  runInference(params: InferenceParams): Promise<InferenceResult>;
}

export interface InferenceParams {
  prompt: string;           // 統一 prompt 格式
  context: ListingContext;  // 結構化上下文（OCR 結果 + 使用者資料）
  model?: string;           // 選填：指定模型版本
  maxTokens?: number;       // 最大輸出 token 數
  temperature?: number;     // 0.0–1.0 溫度參數
}

export interface InferenceResult {
  text: string;             // 生成的文件內容
  usage: {
    inputTokens: number;    // 輸入 token 消耗
    outputTokens: number;   // 輸出 token 消耗
    totalTokens: number;
  };
  model: string;            // 實際使用的模型
  latencyMs: number;        // 推論耗時（毫秒）
}
```

**後端實現** (`src/lib/codex-client/adapters/`):

| 後端 | 檔案 | 特點 |
|------|------|------|
| **Codex** | `codex.ts` | Codex API + prompt 最優化 |
| **Claude Code** | `claude-code.ts` | Claude Code CLI，性能最優 |
| **Gemini** | `gemini.ts` | Google Gemini，免費額度 |
| **Ollama** | `ollama.ts` | 本地 open model（離線備用） |

**選擇機制** (`src/lib/codex-client/index.ts`):

```typescript
const adapterName = process.env.LLM_BACKEND || "codex";

let adapter: CodexAdapter;
switch (adapterName) {
  case "claude-code":
    adapter = new ClaudeCodeAdapter();
    break;
  case "gemini":
    adapter = new GeminiAdapter();
    break;
  case "ollama":
    adapter = new OllamaAdapter();
    break;
  default:
    adapter = new CodexAdapter();
}

export const runCodex = (params) => adapter.runInference(params);
```

**Prompt 版本化** (`src/lib/codex-client/prompts/`):

```
prompts/
├── v1/
│   ├── disclosure-document.md       (for all backends)
│   ├── gemini-adjustments.md        (Gemini 特定微調)
│   ├── claude-code-optimized.md     (Claude Code 優化版)
│   └── ...
├── v2/
│   └── ...
└── current → v1  (symlink)
```

**環境變數設定**：

```bash
# .env.local (開發)
LLM_BACKEND=gemini
GEMINI_API_KEY=...

# .env.production
LLM_BACKEND=claude-code
CLAUDE_CODE_PATH=/usr/bin/codex

# .env.fallback（備用）
LLM_BACKEND=ollama
OLLAMA_API_URL=http://localhost:11434
```

## 後果

### 正面影響

✅ **成本最優**：開發用 Gemini（免費），生產用 Claude Code（性能）

✅ **無停機切換**：若 Codex 故障，改 env `LLM_BACKEND=gemini`，重啟應用即可

✅ **易於測試**：各後端獨立實現，可用 mock adapter 進行單元測試

✅ **擴展簡單**：新增後端（例 GPT-4）只需新增 adapter 實作，無需改業務邏輯

### 負面影響 & 應對

❌ **Prompt 微調成本**：各後端風格略異，需微調 prompt 確保穩定性
- 應對：建立 adapter-specific prompt variant，詳見「Prompt 版本化」

❌ **Token 計數不一致**：各後端計算 token 方式不同，成本預估難精確
- 應對：每個 adapter 實現自己的 token 計數邏輯；定期對帳

❌ **多後端同時故障**：若多個後端都掉線
- 應對：實現備用鏈（`fallback_backends: ["claude-code", "gemini", "ollama"]`），自動重試

## 部署指南

**Docker 環境設定**：

```dockerfile
# Dockerfile
ENV LLM_BACKEND=claude-code
ENV CLAUDE_CODE_PATH=/usr/local/bin/codex

RUN apt-get install -y codex-cli  # 若選 Codex
RUN pip install google-generativeai  # 若選 Gemini
```

**Kubernetes ConfigMap**：

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: llm-config
data:
  LLM_BACKEND: "claude-code"
  CLAUDE_CODE_PATH: "/usr/bin/codex"
```

## 遷移計畫

1. **Phase 1（完成）**：Codex adapter 實作
2. **Phase 2（進行中）**：Gemini adapter 實作 + 環境變數選擇
3. **Phase 3（計畫）**：Claude Code adapter 實作
4. **Phase 4（未來）**：Ollama adapter（離線備用）+ 自動故障轉移

---

> retrofit 產生於 2026-04-27，來源：openspec/specs/llm-backend-adapter
