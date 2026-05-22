## Implementation

- [x] Add failing tests for `Real-address PDF output avoids stale demo data`, covering the `pdf output trust boundary` and `mapping rules`: case name cover, mock certificate suppression, address-floor fallback.
- [x] Update PDF dossier assembly to satisfy `Real-address PDF output avoids stale demo data`, including the `pdf output trust boundary` and `mapping rules`.
- [x] Update PDF preview page so `PDF preview waits for a generated blob URL` and does not mount an empty-src iframe.
- [x] Add a local app icon artifact to support the `Preview behavior` acceptance path and avoid visible-browser icon 404 during acceptance.

## Verification

- [x] Run focused PDF dossier tests.
- [x] Run type-check.
- [x] Run full unit test suite.
- [x] Run production build.
- [x] Run visible Chrome real-address acceptance and PDF text inspection.
- [x] Run `spectra analyze fix-real-address-pdf-output --json` and `spectra validate fix-real-address-pdf-output`.
