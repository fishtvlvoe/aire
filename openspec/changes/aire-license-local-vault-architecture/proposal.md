# AIRE license local vault architecture

## Summary

Define AIRE as a cloud-licensed local privacy workspace:

- AIRE Cloud only manages subscription, license, device binding, feature flags, version policy, and billing metadata.
- AIRE Client performs all case work locally and stores customer case data in an encrypted local vault.
- AIRE Cloud must not receive plaintext case data, owner data, land registry documents, uploaded photos, generated disclosure content, or PDF outputs.

## Why

Fish wants AIRE customers to subscribe online, download or open an authorized interface, and start using the product without manual on-site installation. At the same time, AIRE handles real-estate privacy and legal-risk-heavy data. A traditional browser SaaS or PWA raises a core concern: if the application is served from the public internet, shipped JavaScript can always be changed by the server and could exfiltrate data unless the runtime is strongly constrained and auditable.

The target is therefore not a normal cloud SaaS. The target is a licensed local workspace that feels like SaaS commercially, but keeps customer data local by design.

## Problem To Solve

The architecture must answer these questions before implementation:

1. How can AIRE be delivered without manual installation while still avoiding a normal public-web data path?
2. How can the user open an interface that does not expose a shareable URL and cannot be used from an unbound device?
3. How can AIRE Cloud control entitlement without seeing customer case data?
4. What local/device binding model is strong enough for product and legal positioning, without making the system too complex to ship quickly?

## Non-Goals

- Do not build a full cloud case database for AIRE customer data.
- Do not make AIRE Cloud a processor of plaintext real-estate case data.
- Do not rely on marketing claims alone for privacy separation.
- Do not solve Taiwan legal compliance by architecture text only; legal wording and contracts remain separate deliverables.

## Proposed Direction

Use a staged architecture:

1. Phase 1: Tauri local app with online license and device binding.
2. Phase 2: Localhost browser UI served by the local app, if a browser-like interface is needed.
3. Phase 3: PWA / browser-only local vault only after a separate security spike proves the risk is acceptable.

This keeps delivery fast because the current AIRE codebase already has a Tauri boundary, local SQLite, license concepts, and local PDF generation.
