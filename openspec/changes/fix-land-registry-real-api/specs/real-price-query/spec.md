## ADDED Requirements

### Requirement: mcp_client SHALL read TWINKLE_AI_API_KEY from environment
`src-tauri/src/mcp_client.rs` SHALL read `std::env::var("TWINKLE_AI_API_KEY")`. If the variable is absent or empty, the function SHALL return `Err` with a descriptive message. The previous key name `TWINKLE_HUB_API_KEY` SHALL be removed.

##### Example:

GIVEN env var `TWINKLE_AI_API_KEY` is set to "sk-test"
WHEN mcp_client builds the Authorization header
THEN header SHALL be "Bearer sk-test"

GIVEN env var `TWINKLE_AI_API_KEY` is not set
WHEN call_opendata_query is invoked
THEN result SHALL be Err containing "TWINKLE_AI_API_KEY"

### Requirement: TwinkleAI requests SHALL include Accept header for event stream
Every HTTP request to `https://api.twinkleai.tw/mcp/` SHALL include the header `Accept: application/json, text/event-stream`. Without this header the API returns HTTP 406.

##### Example:

GIVEN a TwinkleAI API call is made
WHEN the HTTP request headers are inspected
THEN the Accept header SHALL equal "application/json, text/event-stream"

### Requirement: TwinkleAI request body SHALL use dataset_id not dataset
The JSON-RPC request body arguments object SHALL use `"dataset_id"` as the key for the dataset identifier. Using `"dataset"` causes a 422 Input validation error.

##### Example:

GIVEN call_opendata_query is called for 台南市
WHEN the request body is serialized
THEN the arguments object SHALL contain key `"dataset_id"` with value "128852"
AND the key `"dataset"` SHALL NOT appear in the arguments object

### Requirement: dataset_id_for_city() SHALL route to city-specific datasets
The auxiliary function `dataset_id_for_city(city: &str) -> &'static str` SHALL return a city-specific dataset ID for cities with dedicated datasets, and SHALL fall back to `"lvr-trades"` for all other cities. Required mappings: 台南市→`"128852"`.

##### Example:

GIVEN city "台南市"
WHEN dataset_id_for_city is called
THEN result SHALL be "128852"

GIVEN city "新北市"
WHEN dataset_id_for_city is called
THEN result SHALL be "lvr-trades"

### Requirement: TwinkleAI queries SHALL use the correct Chinese column names
Where clauses in TwinkleAI SQL queries SHALL use `"鄉鎮市區"` for district filtering and `"土地區段位置或建物區門牌"` for address/road filtering. The column names `district` and `road` do not exist in TwinkleAI datasets.

##### Example:

GIVEN district "永康區" and road keyword "勝利街"
WHEN the where clause is constructed
THEN it SHALL contain `"鄉鎮市區" = '永康區'`
AND it SHALL contain `"土地區段位置或建物區門牌" LIKE '%勝利街%'`

### Requirement: mcp_client SHALL parse SSE response format
TwinkleAI returns responses in Server-Sent Events format. The client SHALL split the response body by newline, find the first line starting with `data:`, strip the prefix, JSON-parse the outer object, extract `result.content[0].text`, then JSON-parse that string to obtain the records array. If no `data:` line is found, the client SHALL return `Err(McpError::ParseError)`.

##### Example:

GIVEN SSE response body:
```
event: message
data: {"jsonrpc":"2.0","id":1,"result":{"content":[{"type":"text","text":"[{\"鄉鎮市區\":\"永康區\",\"單價每平方公尺\":\"47002\"}]"}]}}
```
WHEN mcp_client parses the response
THEN records SHALL contain 1 entry
AND records[0]["單價每平方公尺"] SHALL be "47002"

GIVEN response body with no `data:` line
WHEN mcp_client parses the response
THEN result SHALL be Err(McpError::ParseError)

### Requirement: unit_price SHALL be extracted from 單價每平方公尺
When computing recent sale price statistics, each record's unit price SHALL be read from the field `"單價每平方公尺"` in the TwinkleAI dataset. Records missing this field SHALL be ignored.

##### Example:

GIVEN records `[{"單價每平方公尺":"47002"},{"建物型態":"透天厝"},{"單價每平方公尺":"55000"}]`
WHEN unit_price values are collected
THEN valid prices SHALL be [47002, 55000]
AND the record missing "單價每平方公尺" SHALL be ignored
