## Design

### Data Boundary

Customer case data remains local-only. Registry payloads, owner names, addresses, parcel/building numbers, photos, field survey answers, supplement answers, generated HTML, and generated PDF files are not uploaded to AIRE Cloud or OPCOS.

### UI Surfaces

1. Case setup stays narrow: create case, choose house/land, enter registry query keys, pull registry data.
2. Registry preview appears immediately after pull: grouped imported fields, missing fields, source labels, and save-local-source action.
3. Field survey is a separate workbench: shared fields, house-type fields, strengths/weaknesses, and correctly labeled image uploads.
4. Formal supplement is a second-stage workbench after commission signing: secretary backfill, contract checks, photo naming, and consistency checks.
5. Preview/export reads from one Page Contract data model, so iframe preview and downloaded PDF cannot drift.

### Entitlement Model

Manual work remains available in Basic. Automated pulls and generated assets are gated by SaaS entitlement:

- Basic: registry pull, manual completion, manual image upload, draft/PDF export.
- Pro: Basic plus real-price, nearby-market, location/surrounding maps, cadastral map.
- Advanced: Pro plus aerial photo, street view/reference, floor-plan processing, and future marketing modules.

### Verification Strategy

- Add tests before implementation for registry preview, local persistence, field survey separation, supplement reuse, entitlement gating, and PDF/preview consistency.
- Run Tauri persistence verification before relying on saved registry payloads for the workbench.
- Run printed-spacing checks before considering the fixed PDF template sellable.

### Desktop Distribution Boundary

The paid MVP is not complete until the same local-only behavior is verified inside the packaged desktop app. macOS can be built and checked on the local Mac. Windows must be built and installed through either a Windows VM or a Windows CI runner before it is called shippable.

Current distribution decisions:

- macOS local build is the fast smoke path for day-to-day work.
- Windows `.msi` / `*-setup.exe` output must be verified in UTM Windows VM or GitHub Actions `windows-latest`.
- The existing Electron release workflow is out of scope for future delivery and must be replaced by a Tauri / pnpm release workflow before paid distribution.
- macOS cross-compilation to Windows NSIS is a fallback only; it cannot replace installing and testing the generated installer in Windows.

Desktop package verification must cover activation, local registry persistence, registry payload save-as, preview/PDF parity, Traditional Chinese font rendering, and the fixed-template rules already defined for the disclosure document.
