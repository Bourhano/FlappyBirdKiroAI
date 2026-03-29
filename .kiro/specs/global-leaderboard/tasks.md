# Implementation Plan: Global Leaderboard

## Overview

Extend the existing single-file Flappy Kiro game (`index.html`) with a Firebase-backed global leaderboard. New components (`NicknameManager`, `LeaderboardManager`) are added as plain object literals inside the inline `<script>`. The `Renderer` and `Game` objects are extended in-place. Tests inline/re-implement the components under test, consistent with the existing test conventions.

## Tasks

- [x] 1. Add Firebase CDN script tags to `index.html`
  - Insert two `<script>` tags in `<head>` before the game script: `firebase-app-compat` and `firebase-firestore-compat` from `https://www.gstatic.com/firebasejs/9.23.0/`
  - _Requirements: 1.1, 1.2_

- [x] 2. Implement `NicknameManager` in `index.html`
  - [x] 2.1 Add `NicknameManager` object literal with `STORAGE_KEY`, `MAX_LENGTH`, `getNickname()`, `saveNickname(raw)`, `hasNickname()`, and `validate(raw)`
    - `validate` returns `{ valid: boolean, error: string | null }` — valid when `raw.trim().length` is 1–20
    - `getNickname` / `saveNickname` wrap all `localStorage` calls in try/catch; silent no-op on failure
    - _Requirements: 2.3, 2.4, 2.5, 3.1, 3.3_
  - [ ]* 2.2 Write property test for nickname validation length range (Property 1)
    - **Property 1: Nickname validation accepts exactly the valid length range**
    - **Validates: Requirements 2.3, 2.4**
    - File: `tests/property/nickname_manager.property.test.js`
  - [ ]* 2.3 Write property test for nickname localStorage round-trip (Property 2)
    - **Property 2: Nickname localStorage round-trip**
    - **Validates: Requirements 2.5, 2.6, 3.1**
    - File: `tests/property/nickname_manager.property.test.js`
  - [ ]* 2.4 Write unit tests for `NicknameManager`
    - `hasNickname()` returns `false` when localStorage is empty
    - `hasNickname()` returns `true` after a valid save
    - `getNickname()` returns `null` when localStorage throws
    - `saveNickname()` is a silent no-op when localStorage throws
    - File: `tests/unit/nickname_manager.test.js`
    - _Requirements: 2.3, 2.4, 2.5, 3.3_

- [x] 3. Implement `LeaderboardManager` in `index.html`
  - [x] 3.1 Add `LeaderboardManager` object literal with `db`, `lastEntries`, `isLoading`, `loadError`, and `init()`
    - `init()` checks `typeof window.firebase !== 'undefined'` before calling `firebase.initializeApp(firebaseConfig)` and assigning `this.db = firebase.firestore()`; no-op if global is missing
    - _Requirements: 1.2, 1.3, 8.4_
  - [x] 3.2 Implement `LeaderboardManager.submitScore(nickname, score)`
    - Returns early (resolves) when `score === 0` or `this.db === null`
    - Writes `{ nickname, score, timestamp: Date.now() }` to the `scores` collection via `addDoc`
    - Wraps write in try/catch; logs to `console.warn` on failure and resolves normally
    - _Requirements: 4.1, 4.3, 4.4, 7.1, 7.2, 7.3, 7.4_
  - [x] 3.3 Implement `LeaderboardManager.fetchTopScores()`
    - Queries `scores` collection `orderBy('score', 'desc').limit(10)`
    - Wraps in `Promise.race` against a 5-second timeout
    - On error or timeout: sets `this.loadError = true`, logs to `console.warn`, resolves with `[]`
    - Sets `this.isLoading` flag appropriately before and after the fetch
    - _Requirements: 5.1, 5.2, 5.3, 8.2, 8.3_
  - [x] 3.4 Implement `LeaderboardManager.submitAndFetch(nickname, score)`
    - Calls `submitScore` then `fetchTopScores` in sequence; returns `Promise<ScoreEntry[]>`
    - _Requirements: 4.2, 5.4_
  - [ ]* 3.5 Write property test for ScoreEntry fields (Property 3)
    - **Property 3: ScoreEntry always contains all required fields**
    - **Validates: Requirements 4.1, 7.1, 7.2, 7.3**
    - File: `tests/property/leaderboard_manager.property.test.js`
  - [ ]* 3.6 Write property test for submission timestamp (Property 4)
    - **Property 4: Submission timestamp is current**
    - **Validates: Requirements 7.4**
    - File: `tests/property/leaderboard_manager.property.test.js`
  - [ ]* 3.7 Write unit tests for `LeaderboardManager`
    - `init()` is a no-op when `window.firebase` is undefined
    - `submitScore()` skips write when `score === 0`
    - `submitScore()` resolves (does not reject) when Firestore throws
    - `fetchTopScores()` resolves with `[]` and sets `loadError = true` on Firestore error
    - File: `tests/unit/leaderboard_manager.test.js`
    - _Requirements: 1.3, 4.3, 4.4, 5.3, 8.2, 8.4_

- [x] 4. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Extend `Renderer` with `drawNicknameScreen` and `drawLeaderboardScreen`
  - [x] 5.1 Implement `Renderer.drawNicknameScreen(canvas, inputEl, errorMessage)`
    - Dark semi-transparent overlay (`rgba(0,0,0,0.55)`), white monospace text
    - Reads `inputEl.value` each call to display the typed nickname on canvas
    - Renders inline `errorMessage` below the prompt when non-null
    - _Requirements: 2.2, 6.6_
  - [x] 5.2 Implement `Renderer.drawLeaderboardScreen(canvas, entries, currentScore, currentNickname, isLoading, loadError)`
    - Renders rank, nickname, and score for each entry (up to 10 rows)
    - Highlights the row whose `nickname === currentNickname` with a distinct fill color
    - Always renders `currentScore` for the current session
    - Shows a loading indicator string when `isLoading === true` (no entry rows)
    - Shows "Could not load leaderboard" when `loadError === true`
    - Shows "Play Again" prompt
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.6, 8.3_
  - [x] 5.3 Update `Renderer.render()` to dispatch to `drawNicknameScreen` when `phase === 'nickname'` and `drawLeaderboardScreen` when `phase === 'leaderboard'`
    - Remove dispatch to `drawGameOverScreen` for `phase === 'game_over'` (phase retired)
    - _Requirements: 6.6_
  - [ ]* 5.4 Write property test for leaderboard screen entry rendering (Property 6)
    - **Property 6: Leaderboard screen renders rank, nickname, and score for every entry**
    - **Validates: Requirements 6.1**
    - File: `tests/property/leaderboard_renderer.property.test.js`
  - [ ]* 5.5 Write property test for current player highlight (Property 7)
    - **Property 7: Leaderboard screen highlights the current player's entry**
    - **Validates: Requirements 6.2**
    - File: `tests/property/leaderboard_renderer.property.test.js`
  - [ ]* 5.6 Write property test for current session score always shown (Property 8)
    - **Property 8: Leaderboard screen always shows the current session score**
    - **Validates: Requirements 6.3**
    - File: `tests/property/leaderboard_renderer.property.test.js`
  - [ ]* 5.7 Write property test for loading indicator (Property 10)
    - **Property 10: Loading indicator is shown while leaderboard is fetching**
    - **Validates: Requirements 8.3**
    - File: `tests/property/leaderboard_renderer.property.test.js`
  - [ ]* 5.8 Write unit tests for new `Renderer` methods
    - `drawLeaderboardScreen()` renders "Could not load leaderboard" when `loadError === true`
    - `drawLeaderboardScreen()` renders "Play Again" prompt
    - File: `tests/unit/leaderboard_manager.test.js` (renderer section) or inline in renderer test
    - _Requirements: 5.3, 6.4_

- [x] 6. Add hidden `<input>` element for mobile nickname entry
  - Add `<input type="text" id="nicknameInput">` to `<body>` with CSS `position: absolute; left: -9999px`
  - _Requirements: 2.2_

- [x] 7. Extend `Game` state machine
  - [x] 7.1 Extend `GameState` object in `Game.init()` with new fields: `nickname`, `leaderboardEntries`, `leaderboardLoading`, `leaderboardError`, `nicknameError`
    - Call `LeaderboardManager.init()` from `Game.init()`
    - Check `NicknameManager.hasNickname()` to set initial `phase` to `'nickname'` or `'idle'`
    - Focus `#nicknameInput` when entering `nickname` phase
    - _Requirements: 1.2, 2.1, 2.6_
  - [x] 7.2 Add `'nickname'` phase handling in `Game.update()`
    - On flap/click/space input: read `#nicknameInput.value`, call `NicknameManager.validate()`, show error or call `NicknameManager.saveNickname()` and transition to `'idle'`
    - Store validated nickname in `gs.nickname`
    - _Requirements: 2.3, 2.4, 2.5_
  - [x] 7.3 Replace `Game.gameOver()` — transition to `'leaderboard'` instead of `'game_over'`
    - Set `gs.leaderboardLoading = true`, call `LeaderboardManager.submitAndFetch(gs.nickname, gs.score)` asynchronously
    - On resolution: update `gs.leaderboardEntries`, `gs.leaderboardLoading`, `gs.leaderboardError`; re-render
    - _Requirements: 4.1, 4.2, 5.2, 8.3_
  - [x] 7.4 Add `'leaderboard'` phase handling in `Game.update()`
    - On flap/click/space input: call `Game.restart()`
    - _Requirements: 6.4, 6.5_
  - [ ]* 7.5 Write property test for flap in leaderboard phase resets state (Property 9)
    - **Property 9: Flap input in leaderboard phase transitions to playing with reset state**
    - **Validates: Requirements 6.5**
    - File: `tests/property/leaderboard_manager.property.test.js`
  - [ ]* 7.6 Write unit tests for new game phase transitions
    - `nickname → idle` on valid nickname confirm
    - `playing → leaderboard` on collision / boundary
    - `leaderboard → playing` on flap input with full state reset
    - File: `tests/unit/leaderboard_manager.test.js` (game transitions section)
    - _Requirements: 2.5, 4.1, 6.5_

- [x] 8. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property test comments follow the format: `// Feature: global-leaderboard, Property N: <description>`
- Run tests with: `npm test`
