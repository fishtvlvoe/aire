## ADDED Requirements

### Requirement: mcp-http-json-rpc-call

The Rust module `src-tauri/src/mcp_client.rs` SHALL send HTTP POST requests to `https://api.twinkleai.tw/mcp/` with JSON-RPC 2.0 payload and Authorization header `Bearer <TWINKLE_HUB_API_KEY>`.

The request payload SHALL use method `tools/call` with tool name `opendata-query_rows`.

#### Scenario: Successful tool call returns rows

WHEN the MCP client calls `opendata-query_rows` with dataset_id="lvr-trades", where="鄉鎮市區 = '東區'", limit=20
THEN the HTTP response SHALL be 200
AND the response body SHALL contain a `result` field with an array of trade records in the `content[0].text` field as a JSON string

##### Example:
- Request body: `{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"opendata-query_rows","arguments":{"dataset_id":"lvr-trades","where":"鄉鎮市區 = '東區'","limit":20}}}`
- Response 200: `{"jsonrpc":"2.0","id":1,"result":{"content":[{"type":"text","text":"[{\"鄉鎮市區\":\"東區\",\"總價元\":8500000}]"}]}}`

#### Scenario: Missing API key returns configuration error

WHEN environment variable `TWINKLE_HUB_API_KEY` is not set at Rust runtime
THEN the Rust command SHALL return `Err("TWINKLE_HUB_API_KEY not configured")` without panicking
AND no HTTP request SHALL be made

##### Example:
- Environment: TWINKLE_HUB_API_KEY unset
- Output: Err("TWINKLE_HUB_API_KEY not configured")

### Requirement: api-key-rust-only

The Twinkle Hub API key (`TWINKLE_HUB_API_KEY`) SHALL only be accessed in the Rust process via `std::env::var`. It SHALL NOT appear in any Next.js `NEXT_PUBLIC_*` variable, browser network response body, or JS bundle.

#### Scenario: API key absent from frontend bundle

WHEN the Next.js app is built (`pnpm build`)
THEN the string `sk-66l1A3` SHALL NOT appear in any file under `.next/`

##### Example:
- Check: `grep -r "sk-66l1A3" .next/` returns 0 matches

### Requirement: where-clause-parameterized

The Rust function building the `where` clause SHALL accept only structured parameters (`district: &str`, `keyword: &str`) and construct the SQL string internally. Raw SQL strings SHALL NOT be accepted from the frontend IPC call.

#### Scenario: Where clause constructed from district and keyword

WHEN the Rust command receives `district="東區"` and `keyword="裕農路"`
THEN the internal where string SHALL equal `鄉鎮市區 = '東區' AND 土地區段位置建物門牌 LIKE '%裕農路%'`

##### Example:
- Input: district="東區", keyword="裕農路"
- Constructed where: `鄉鎮市區 = '東區' AND 土地區段位置建物門牌 LIKE '%裕農路%'`
