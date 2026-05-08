## 1. 規格與設計

- [ ] 1.1 建立 `agent-docs-governance` spec，對應 Agent docs scanner、classifier、migration、validation requirements [Tool: codex]
- [ ] 1.2 建立 design，說明 Skill / project docs / script / hook 的責任分工，對應 D1: 使用 Skill 承載全域方法，不使用 hook 作為主要入口 [Tool: codex]

## 2. 掃描與分類

- [ ] 2.1 [P] 實作 project scanner，掃描 `/Users/fishtv/Development` 下的 `AGENTS.md` / `CLAUDE.md`，對應 Requirement: Agent instruction scanner [Tool: codex]
- [ ] 2.2 [P] 實作 classification report，輸出 keep / migrate / create / skip / manual-review，對應 Requirement: Agent instruction classification [Tool: codex]

## 3. 遷移與驗證

- [ ] 3.1 實作單一專案 migrator，產生短 `AGENTS.md` 與 `docs/agents/` 結構，對應 Requirement: Progressive loading migration [Tool: codex]
- [ ] 3.2 實作 verifier，檢查路由文件存在與核心區塊保留，對應 Requirement: Agent docs validation [Tool: codex]

## 4. 全域 Skill 整合

- [ ] 4.1 更新 `agent-progressive-loading` Skill，加入自動掃描與分類流程，對應 Requirement: Global skill reuse [Tool: codex]
- [ ] 4.2 驗證新 Codex session 可透過 Skill 理解未來專案 agent docs 遷移流程，對應 Requirement: Global skill reuse [Tool: codex]

## 5. Review

- [ ] 5.1 Review change scope，確認沒有把 three-ai 專案規則複製到全域 Skill，對應 D3: 專案事實留在專案，全域 Skill 只保存方法 [Tool: kimi]
