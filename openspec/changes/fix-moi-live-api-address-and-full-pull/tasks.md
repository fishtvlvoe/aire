## Implementation

- [x] Implement `Address-to-parcel lookup` and design decision `地址查詢送完整地址`: update MOI_API_037 address lookup payload to send full normalized address with city.
- [x] Implement `Address-to-parcel lookup`: add/adjust unit coverage proving city is preserved in address lookup request payload.
- [x] Implement `Seven parcel data API endpoints`: run real 裕農路 live API dump across all AIRE-supported building and land APIs.
- [x] Implement `Seven parcel data API endpoints` and design decision `不可自動呼叫的 MOI API 要列入排除理由`: run raw live attempts for every input-available MOI/COP endpoint documented locally, and record skipped owner/private-input APIs with reasons.
- [x] Cover design decision `全量驗收分為地址、建物、土地、可用 MOI 端點四層`: include address lookup, structured building/land runs, raw endpoint attempts, and skipped endpoint reasons in the JSON.
- [x] Cover design decision `驗收資料保留完整結果，不只摘要`: save per API payload/status/code/message/data/error/cost details.
- [x] Save full live JSON output to `/tmp/aire-yunong-live-api.json` and `/Users/fishtv/Downloads/裕農路-live-api.json`.
- [x] Remove or keep live runner without secrets according to final implementation decision.

## Verification

- [x] Run focused Rust tests for address lookup.
- [x] Run live COP裕農路 ignored test with real `.env` credentials.
- [x] Inspect JSON for address lookup result count, raw MOI endpoint attempt count, structured API success/failure count, skipped endpoint reasons, and total cost.
- [x] Run `spectra analyze fix-moi-live-api-address-and-full-pull --json`.
- [x] Run `spectra validate fix-moi-live-api-address-and-full-pull`.
