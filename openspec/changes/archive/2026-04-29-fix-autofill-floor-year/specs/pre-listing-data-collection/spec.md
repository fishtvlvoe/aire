## MODIFIED Requirements

### Requirement: OCR Field Key Mapping

The OCR key `stories` (total floor count from building transcript) SHALL be mapped to
form field key `floor_total`, not `floor_count`.

`floor_count` is a virtual composite key used only to identify the compound floor
component in the form renderer. The actual form state uses sub-keys `floor_current`
(current floor) and `floor_total` (total floors). Mapping to `floor_count` results in
the prefill value being written to a phantom key that is never read.

The mapping `completion_date → year_built` SHALL remain unchanged.

### Requirement: OCR Value Normalization for year_built

The `completion_date` OCR field SHALL be normalized using `normalizeRocYear()`,
which extracts the ROC (民國) year as an integer (e.g., 79) from date strings
such as "民國79年06月15日" or "民國79年6月".

The previous behavior of calling `normalizeDate()` (which returns an ISO Gregorian
date string like "1990-06-15") is incorrect because the `year_built` form field is
rendered as `type="number"`, which cannot display non-numeric strings.

`normalizeDate()` SHALL NOT be modified and SHALL continue to be used for other
fields that require full Gregorian date strings (e.g., `registration_date`).
