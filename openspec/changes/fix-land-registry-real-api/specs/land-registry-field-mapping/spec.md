## MODIFIED Requirements

### Requirement: COP API endpoint paths SHALL follow the real service URL pattern
The land registry client SHALL construct all COP API endpoint URLs using the real pattern `/{ServiceName}/{version}/{FunctionName}` relative to the configured `LAND_REGISTRY_API_BASE_URL`. The wiremock mock paths (`/land/address-to-parcel`, `/land/parcel/land-registry`, etc.) SHALL NOT appear in production code paths.

Mapping table (wiremock path → real COP path):
- address lookup → `/BuildingNo/1.0/QueryByAddress`
- land registry → `/LandDescription/1.0/QueryByLandNo`

##### Example:

GIVEN the address-to-parcel API is called
WHEN the HTTP request is constructed
THEN the URL path SHALL be `/BuildingNo/1.0/QueryByAddress`
AND the path SHALL NOT contain `/land/address-to-parcel`

### Requirement: COP API request body SHALL be a JSON array with CITY/ADDRESS or UNIT/SEC/NO
The address-to-parcel API call SHALL send body `[{"CITY": "<city_code>", "ADDRESS": "<address>"}]`. The land description API call SHALL send body `[{"UNIT": "<unit>", "SEC": "<sec>", "NO": "<no>"}]`. Both SHALL be Content-Type `application/json`.

##### Example:

GIVEN address "台南市永康區勝利街58巷4號1樓"
WHEN address_to_parcel is called
THEN the request body SHALL be `[{"CITY":"D","ADDRESS":"台南市永康區勝利街58巷4號1樓"}]`

### Requirement: COP API response SHALL be parsed from RESPONSE[0] structure
All COP API responses have the shape `{"STATUS": 1, "RESPONSE": [{...}]}`. The client SHALL check `STATUS == 1` before processing. Land description data SHALL be extracted from `RESPONSE[0].LANDREG`. Address lookup SHALL extract `RESPONSE[0].BLDGREG` (or null if no match).

##### Example:

GIVEN response `{"STATUS":1,"RESPONSE":[{"UNIT":"BA","LANDREG":{"AREA":"4453"}}]}`
WHEN land_registry parses the response
THEN area SHALL be "4453"

GIVEN response `{"STATUS":1,"RESPONSE":[{"CITY":"D","ADDRESS":"...","BLDGREG":null}]}`
WHEN address_to_parcel parses the response
THEN the result SHALL be Ok(None)

### Requirement: city_code_from_address() SHALL map city name prefix to 1-char county code
The auxiliary function `city_code_from_address(address: &str) -> &'static str` SHALL match the city name prefix of the address string and return the corresponding single-character county code. Required mappings: 台北市→"A", 台中市→"B", 台南市→"D", 高雄市→"E", 新北市→"F", 桃園市→"H". If no prefix matches, SHALL return "A" and emit a `log::warn!`.

##### Example:

GIVEN address "台南市永康區勝利街58巷4號1樓"
WHEN city_code_from_address is called
THEN the result SHALL be "D"

GIVEN address "台北市中正區重慶南路1號"
WHEN city_code_from_address is called
THEN the result SHALL be "A"

### Requirement: LandDescription response SHALL supply zoning and land value data
The LandDescription endpoint (`/LandDescription/1.0/QueryByLandNo`) returns `LANDREG.ZONING`, `LANDREG.ALVALUE` (公告地價), and `LANDREG.ALPRICE` (公告現值). The client SHALL extract these fields from the single LandDescription call rather than making separate zoning or land-value endpoint calls.

##### Example:

GIVEN LANDREG `{"AREA":"4453","ZONING":"住","ALVALUE":"71264","ALPRICE":"15384"}`
WHEN the client maps fields
THEN zoning SHALL be "住" AND announced_value SHALL be "71264" AND assessed_value SHALL be "15384"

### Requirement: get_token() SHALL be marked deprecated and return empty string
The function `get_token()` in `src-tauri/src/land_registry/client/mod.rs` SHALL be annotated with a deprecation comment and SHALL return `Ok(String::new())`. COP API uses Basic Auth exclusively; Bearer tokens are not required.

##### Example:

GIVEN get_token() is called
THEN the return value SHALL be Ok("") (empty string)
AND a comment above the function SHALL state "DEPRECATED: COP API uses Basic Auth only"
