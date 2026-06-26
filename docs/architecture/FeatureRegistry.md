# Feature registry

**Source of truth (machine):** `src/governance/registries/features.js`  
**Validate:** `npm run audit:features`

Human-readable product map: [encyclopedia/02-pages-and-clicks.md](../encyclopedia/02-pages-and-clicks.md).

## Adding a feature

1. Add row to `src/governance/registries/features.js`.
2. Implement under `src/ui/features/<area>/`.
3. Add engine logic in `src/engines/` (+ tests in `tests/suites/` where critical).
4. Wire route in `src/App.jsx`.
5. Run `npm run audit:features`.

## Dependency rules

- Features should not import sibling feature folders — use `primitives/`, `patterns/`, or shared hooks.
- Hooks must not import `ui/features/` directly.
- Cloud sync only through `src/services/sync/syncEngine.js` (see `cloud-sync-local-first` rule).
