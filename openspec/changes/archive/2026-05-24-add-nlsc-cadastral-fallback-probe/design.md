## Context

官方 API 列表顯示 CAD_009 指定門牌查詢地號的 API 代碼為 `AddressQueryLand`，輸入為 `/搜尋字串[/回傳數量]`，範例端點為 `https://api.nlsc.gov.tw/idc/AddressQueryLand/台中市南屯區黎明路二段497號`。CAD_011 指定地號查詢建號列表與土地權利人類別的 API 代碼為 `CadasLandInfo`，輸入為 `/縣市代碼/段代碼/地號(8碼或簡式)`，範例端點為 `https://api.nlsc.gov.tw/dmaps/CadasLandInfo/B/1121/00080000`。

裕農路 live probe 結果：

- CAD_009 對 `台南市東區裕農路288巷17號8樓之1/10` 回 HTTP 404、body `PERMISSION DENIED`
- CAD_009 對 `台南市東區裕農路288巷17號/10` 回 HTTP 404、body `PERMISSION DENIED`
- CAD_011 對 `D/1556/00700000` 回 HTTP 404、body `PERMISSION DENIED`
- CAD_011 對 `D/1556/70` 回 HTTP 404、body `PERMISSION DENIED`

## Decision

新增 NLSC CAD client，但預設將權限不足視為 blocked，不把它降級成 empty list。產品流程採用「可觀測備援」而不是「假成功」：

```text
COP MOI_API_037
  成功 → source=cop_moi，可信鏈路
  未授權/查無 → 嘗試 NLSC CAD（若設定允許）

NLSC CAD_009
  成功 → 取得地號候選，source=nlsc_cad，trustedForPdf=false
  PERMISSION DENIED → blocked_reason=nlsc_permission_denied

NLSC CAD_011
  成功 → 補建號候選，source=nlsc_cad，trustedForPdf=false
  PERMISSION DENIED → blocked_reason=nlsc_permission_denied

若無正式 COP/MOI 謄本資料或人工確認
  → 進補件/人工確認
  → 不進正式 PDF
```

## Implementation Contract

### Client behavior

- `NlscCadastralClient::address_query_land` SHALL call `/idc/AddressQueryLand/{address}/{limit}` and parse XML `<addressItem>` entries into land candidates with office, section, land number, content, location.
- `NlscCadastralClient::cadas_land_info` SHALL call `/dmaps/CadasLandInfo/{county}/{section}/{landNo}` and parse JSON build list and owner type summary.
- The client SHALL classify HTTP 404 with body `PERMISSION DENIED` as `NlscPermissionDenied`.
- The client SHALL classify malformed XML/JSON as parse error, not empty result.
- Empty result is allowed only when the upstream response is valid and contains no candidates.

### Address lookup behavior

- `land_registry_address_lookup` SHALL keep COP as the first source.
- If COP returns one or more official parcel results, the command SHALL return those results without NLSC fallback.
- If COP returns empty because of permission/no data and NLSC fallback is enabled, the command SHALL attempt CAD_009 and CAD_011.
- NLSC fallback results SHALL include source metadata. They SHALL NOT be treated as formal MOI registry data.
- Permission denied from NLSC SHALL be observable to caller as blocked metadata or typed error; it SHALL NOT be silently swallowed as no match.

### PDF safety behavior

- NLSC CAD result entries SHALL NOT be marked trusted for PDF.
- Formal PDF assembly SHALL continue to accept only trusted MOI API or manual-confirmed provenance entries.

### Verification

- Unit tests SHALL cover CAD_009 XML parse, CAD_011 JSON parse, permission denied classification, and address lookup fallback blocked state.
- Ignored live test SHALL probe 裕農路 CAD_009/CAD_011 and write evidence to `/tmp/aire-nlsc-cad-yunong-live.json`.
- SR gate SHALL pass after implementation.

## Risks

- CAD API may require IP binding or account approval. In that case the product must show application guidance and not pretend the feature is available.
- NLSC CAD data is cadastral/land-map support data, not full legal transcript data. It can help find land/building identifiers but does not replace MOI transcript APIs.
