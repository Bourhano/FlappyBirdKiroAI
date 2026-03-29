# Tech Stack

## Runtime
- Vanilla JavaScript (ES2020+), no build step required
- Single HTML file (`index.html`) contains all game logic as inline `<script>`
- Browser Canvas API (`CanvasRenderingContext2D`) for all rendering
- Web Audio API via `new Audio()` for sound effects
- `localStorage` for high score and nickname persistence
- Firebase Firestore (v9 compat) loaded via CDN `<script>` tags — no npm bundler involved
  - `firebase-app-compat` and `firebase-firestore-compat` from `https://www.gstatic.com/firebasejs/9.23.0/`
  - Initialized once in `LeaderboardManager.init()`; all Firestore ops are client-side

## Testing
- **Test runner**: [Vitest](https://vitest.dev/) v1.6+ with `jsdom` environment
- **Property-based testing**: [fast-check](https://fast-check.dev/) v3.19+
- Tests live in `tests/unit/` and `tests/property/`
- Because game logic is in an inline script (not ES modules), all test files **inline/re-implement** the module under test rather than importing from `index.html`

## Common Commands

```bash
# Run all tests (single pass, no watch)
npm test
```

## Dependencies
All dependencies are `devDependencies` — there are no runtime npm dependencies.

| Package | Purpose |
|---|---|
| `vitest` | Test runner |
| `fast-check` | Property-based test generation |
| `jsdom` | DOM environment for tests |
