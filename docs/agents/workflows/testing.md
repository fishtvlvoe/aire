# Testing Workflow

Use this when changing behavior, adding nontrivial logic, touching generated documents, or modifying UI workflows.

## Commands

```bash
npm run lint
npm run test
npm run test -- --coverage
npm run build
```

Run the smallest useful command first, then broaden when risk or touched surface requires it.

## Expectations

- New logic over roughly 10 lines should usually have unit coverage.
- Document generation needs rendered-output verification when layout or PDF content changes.
- OCR/LLM behavior should use real or mock fixtures.
- Target coverage is above 70 percent when coverage is relevant to the change.

## Playwright

Use Playwright for:

- Listing workflow navigation.
- Form state and validation flows.
- PDF/document output checks.
- Visual regressions where text/layout matters.

Prefer focused tests for the changed flow before running broad suites.
