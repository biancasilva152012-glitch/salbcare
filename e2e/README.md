# End-to-end tests (Playwright)

These tests cover the freemium experience for **anonymous demo users** on
`/experimente`. They deliberately avoid logging in: every freemium limit
applies the same way to a guest as it does to a fresh free account, so
exercising the demo is the most reliable surface to test.

## Run

```bash
# in one terminal — start the dev server
bun run dev

# in another terminal — run the suite
bunx playwright test

# or run a single spec
bunx playwright test e2e/freemium-limits.spec.ts

# generate / update snapshots
bunx playwright test --update-snapshots
```

The first run will download the Chromium browser (~150MB).

## Coverage

| Spec                                 | What it checks                                              |
| ------------------------------------ | ----------------------------------------------------------- |
| `freemium-limits.spec.ts`            | Patient + appointment create limits, paywall blocks ONLY the create button, navigation/edit stay open |
| `freemium-exports.spec.ts`           | CSV + PDF export buttons download files with the demo data  |
| `freemium-debug-panel.spec.ts`       | Debug panel widget toggles and shows per-module counters    |

## CI

Set `PLAYWRIGHT_BASE_URL` to skip the embedded webServer and target a
deployed preview (e.g. `https://salbcare.lovable.app`).
