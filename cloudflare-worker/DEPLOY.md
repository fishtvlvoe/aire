# aire.opcos.me Worker 部署 SOP

## 步驟 1：登入 Cloudflare

```bash
wrangler login
```

瀏覽器會開啟授權頁面，按 Allow 即可。

## 步驟 2：建立 KV Namespace 並填入 ID

```bash
cd cloudflare-worker
wrangler kv:namespace create LICENSES
```

輸出範例：
```
🌀 Creating namespace with title "aire-opcos-me-LICENSES"
✨ Success!
Add the following to your configuration file in your kv_namespaces array:
{ binding = "LICENSES", id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" }
```

將輸出的 `id` 值填入 `wrangler.toml`：

```toml
[[kv_namespaces]]
binding = "LICENSES"
id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"  # ← 將此處的 REPLACE_WITH_KV_ID 換成上面的 id
```

## 步驟 3：部署 Worker

```bash
wrangler deploy
```

確認輸出包含 `Deployed to https://aire-opcos-me.<your-subdomain>.workers.dev`。

## 步驟 4：設定 DNS（Cloudflare Dashboard）

登入 [Cloudflare Dashboard](https://dash.cloudflare.com/)，選取 `opcos.me` 域名，進入 DNS 設定，新增：

| Type  | Name | Content                                            | Proxy |
|-------|------|----------------------------------------------------|-------|
| CNAME | aire | `aire-opcos-me.<your-subdomain>.workers.dev`       | ✅ 已代理 |

確認 `https://aire.opcos.me/api/license/verify` 回傳 404 `{"error":"invalid_license"}` 表示 Worker 已上線。

## 預載序號

部署後使用以下指令預載序號（每組序號單獨執行）：

```bash
wrangler kv:key put --binding LICENSES "license:<序號>" '{"status":"inactive"}'
```

範例：
```bash
wrangler kv:key put --binding LICENSES "license:AIRE-2025-XXXX-XXXX" '{"status":"inactive"}'
```

## Rollback

如需回復前一版 Worker：

```bash
wrangler rollback
```
