## Problem Statement

The current API usage display in Kimi Code CLI creates significant confusion for users, particularly those migrating from Claude Code or managing multiple models. There are three core UX issues:

### 1. Two Separate Quota Systems with No Explanation

Kimi Code CLI's `/usage` command shows quotas from the **Kimi Code platform** (`api.kimi.com/coding/v1`) with its own rate limits (5h / weekly / 7d). However, the web console dashboard shows quotas from the **Kimi Open Platform** under "频限明细". These are completely independent systems, but:
- Both are labeled generically as "usage" or "用量"
- Neither UI explains that they measure different things
- Users naturally expect the numbers to match, leading to confusion

**Screenshot comparison:**
- CLI `/usage`: `Weekly limit 50% left` / `5h limit 88% left`
- Web console: `本周用量 47%` / `频限明细 0%`
- These divergent numbers cannot be reconciled because they come from different backends

### 2. Inverted Percentage Semantics

The display conventions are opposite between systems:
- **CLI** shows `% left` (remaining quota)
- **Web console** shows `%` (consumed quota)

A user seeing `50% left` in CLI and `47%` on the web must mentally invert one to compare them. This is especially problematic because the underlying measurements are already different (Issue #1 above).

### 3. Poor Discoverability and Missing Granularity

- Users must **actively type `/usage`** to see any quota information. There is no ambient status indicator.
- The display only shows **percentages**, not absolute numbers (tokens used / tokens available, or request counts).
- There is no way to see **which model calls consumed the quota**, making it impossible to optimize resource allocation across models.

For example, a user running Claude Code + Kimi Code CLI + direct API calls cannot determine:
- How much of the 5h window was consumed by CLI vs. other tools
- Whether they should switch to a different model to preserve quota
- Whether they are approaching a limit *before* hitting it

## Proposed Solutions

### Short-term: Fix the `/usage` Display

1. **Add a header explaining which system is being measured:**
   ```
   ┌─ Kimi Code Platform Usage ─────────────────────────┐
   │ (Separate from Open Platform quotas at kimi.com)    │
   ```

2. **Show absolute numbers alongside percentages:**
   ```
   Weekly limit   ████████░░░░░░░░  50% left  (65K / 130K tokens)
   5h limit       ████████████░░░░  88% left  (2.1K / 2.5K requests)
   ```

3. **Use consistent semantics** — either always show `% used` or always show `% left`, but not a mix across interfaces.

### Medium-term: Add a Persistent Status Indicator

Related to #2149 (statusline feature request), but even a minimal implementation would help:
- Show a subtle indicator in the shell prompt bar when any quota drops below 30%
- Color-code: green (>50% left) → yellow (20-50%) → red (<20%)

### Long-term: Unified Quota Dashboard

Ideally, the web console should either:
- Show **both** Kimi Code platform quotas and Open Platform quotas in separate sections
- Or provide a way for CLI users to see their Open Platform limits within CLI

Currently, a user must check two entirely separate UIs to understand their full usage picture.

## References

- Related: #2149 — [Feature] Claude Code-style configurable statusline
- The `5h limit` is a Kimi Code platform-specific rate limiter (not present in the standard Open Platform API)
- Web console URL: https://platform.moonshot.cn/console

## Environment

- Kimi CLI version: 1.41.0
- Login method: OAuth via `kimi login` (managed:kimi-code provider)
- Also using: Claude Code with Kimi API key (same account, different consumption path)
