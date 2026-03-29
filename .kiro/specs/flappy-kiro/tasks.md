# Implementation Plan: Flappy Kiro

## Overview

Implement the Flappy Kiro game as a single `index.html` file with vanilla JavaScript and HTML5 Canvas. Tests are organized in `tests/unit/` and `tests/property/` using Vitest and fast-check.

## Tasks

- [x] 1. Set up project scaffolding and test infrastructure
  - Create `package.json` with Vitest and fast-check as dev dependencies
  - Create `vitest.config.js` configured for browser-compatible JS (jsdom environment)
  - Create `index.html` with a `<canvas>` element, score bar div, and `<script>` block stubs for all components
  - Create empty test files matching the structure in `tests/unit/` and `tests/property/`
  - _Requirements: 1.1_

- [x] 2. Implement `getScaledConstants` and `PhysicsEngine`
  - [x] 2.1 Implement `getScaledConstants(canvas)` returning gravity, flapVelocity, scrollSpeed, gapSize, pipeWidth, ghostyWidth, ghostyHeight, scoreBarHeight scaled from reference height 600px
    - _Requirements: 1.4_
  - [ ]* 2.2 Write property test for scaled constants proportional ratios (Property 4)
    - **Property 4: Scaled constants maintain proportional ratios**
    - **Validates: Requirements 1.4**
  - [x] 2.3 Implement `PhysicsEngine.applyGravity(ghosty)` and `PhysicsEngine.applyFlap(ghosty)` mutating the ghosty object
    - _Requirements: 2.1, 2.2, 2.3_
  - [ ]* 2.4 Write property test for gravity accumulation (Property 1)
    - **Property 1: Gravity accumulates velocity and position**
    - **Validates: Requirements 2.1, 2.3**
  - [ ]* 2.5 Write property test for flap velocity (Property 2)
    - **Property 2: Flap sets upward velocity**
    - **Validates: Requirements 2.2, 3.4**
  - [x] 2.6 Implement `PhysicsEngine.clampToBounds(ghosty, canvasHeight, scoreBarHeight)` — ceiling clamp sets vy to 0, floor triggers game over flag
    - _Requirements: 2.4, 2.5_
  - [ ]* 2.7 Write property test for bottom boundary (Property 3)
    - **Property 3: Bottom boundary triggers game over**
    - **Validates: Requirements 2.5, 6.3**
  - [ ]* 2.8 Write unit tests for PhysicsEngine
    - Test ceiling clamp zeroes vy; test floor returns game-over signal
    - _Requirements: 2.4, 2.5_

- [x] 3. Implement `ObstacleManager`
  - [x] 3.1 Implement `ObstacleManager.spawnPipe(gameState)` producing a `Pipe` object with randomized `gapTop`/`gapBottom` within safe bounds and correct `GAP_SIZE`
    - _Requirements: 4.1, 4.3, 4.4_
  - [ ]* 3.2 Write property test for pipe gap size (Property 5)
    - **Property 5: Pipe gap size is always GAP_SIZE**
    - **Validates: Requirements 4.3**
  - [ ]* 3.3 Write property test for pipe gap within safe bounds (Property 6)
    - **Property 6: Pipe gap is always within safe vertical bounds**
    - **Validates: Requirements 4.4**
  - [x] 3.4 Implement `ObstacleManager.spawnCloud(gameState)` producing a `Cloud` object at a randomized vertical position
    - _Requirements: 5.1_
  - [x] 3.5 Implement `ObstacleManager.update(gameState)` — move all pipes and clouds leftward by `SCROLL_SPEED`, spawn new pipes at `PIPE_INTERVAL`, despawn off-screen obstacles
    - _Requirements: 4.2, 4.5, 5.2, 5.5_
  - [ ]* 3.6 Write property test for scroll speed (Property 8)
    - **Property 8: All obstacles scroll leftward at SCROLL_SPEED per frame**
    - **Validates: Requirements 4.2, 5.2**
  - [ ]* 3.7 Write property test for off-screen removal (Property 9)
    - **Property 9: Off-screen obstacles are removed after update**
    - **Validates: Requirements 4.5, 5.5**
  - [ ]* 3.8 Write property test for pipe spawn interval (Property 7)
    - **Property 7: Pipe spawn interval is regular**
    - **Validates: Requirements 4.1**
  - [x] 3.9 Implement `ObstacleManager.reset()` clearing pipes and clouds arrays
    - _Requirements: 10.5_
  - [ ]* 3.10 Write unit tests for ObstacleManager
    - Test that reset empties arrays; test cloud spawns within canvas bounds
    - _Requirements: 4.5, 5.1, 5.5_

- [x] 4. Implement `ScoreManager`
  - [x] 4.1 Implement `ScoreManager.loadHighScore()` and `ScoreManager.saveHighScore()` with try/catch for localStorage unavailability, degrading to in-memory
    - _Requirements: 7.4_
  - [ ]* 4.2 Write property test for localStorage round-trip (Property 14)
    - **Property 14: High score localStorage round-trip**
    - **Validates: Requirements 7.4**
  - [x] 4.3 Implement `ScoreManager.checkPipeCrossing(ghosty, pipes)` — increment score and mark pipe as scored when ghosty fully passes a pipe; update high score if exceeded
    - _Requirements: 7.1, 7.3_
  - [ ]* 4.4 Write property test for score increments once per pipe (Property 11)
    - **Property 11: Score increments exactly once per pipe crossing**
    - **Validates: Requirements 7.1**
  - [ ]* 4.5 Write property test for high score update (Property 13)
    - **Property 13: High score updates when current score exceeds it**
    - **Validates: Requirements 7.3**
  - [x] 4.6 Implement `ScoreManager.reset()` — reset score to 0, retain high score
    - _Requirements: 7.5_
  - [ ]* 4.7 Write property test for reset behavior (Property 15)
    - **Property 15: Reset clears score but retains high score**
    - **Validates: Requirements 7.5**
  - [ ]* 4.8 Write unit tests for ScoreManager
    - Test localStorage unavailability degrades gracefully; test reset retains high score
    - _Requirements: 7.4, 7.5_

- [x] 5. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement `InputHandler`
  - [x] 6.1 Implement `InputHandler.bind(canvas)` attaching `keydown` (spacebar), `click`, and `touchstart` listeners that set `pendingFlap = true`
    - _Requirements: 3.1, 3.2, 3.3_
  - [x] 6.2 Implement `InputHandler.consumeFlap()` returning `true` and clearing the flag if a flap is pending
    - _Requirements: 3.1, 3.2, 3.3_
  - [ ]* 6.3 Write unit tests for InputHandler
    - Test spacebar, click, and touchstart each set `pendingFlap = true`; test `consumeFlap` clears the flag; test deduplication (multiple events = one flap)
    - _Requirements: 3.1, 3.2, 3.3_

- [x] 7. Implement `AudioManager`
  - [x] 7.1 Implement `AudioManager` with `jumpSound` and `gameOverSound` as `HTMLAudioElement` instances, `unlocked` flag, `unlock()`, `playJump()`, and `playGameOver()` — all play calls are no-ops until `unlocked` is true; errors caught silently
    - _Requirements: 8.1, 8.2, 8.3_
  - [ ]* 7.2 Write unit tests for AudioManager
    - Test `playJump()` is a no-op before unlock; test `playGameOver()` is called on game over; test audio load failure does not crash
    - _Requirements: 8.1, 8.2, 8.3_

- [x] 8. Implement `Renderer`
  - [x] 8.1 Implement `Renderer.drawBackground(canvas)` — light blue fill with sketchy texture lines
    - _Requirements: 9.1_
  - [x] 8.2 Implement `Renderer.drawGhosty(ghosty)` — draw `assets/ghosty.png` centered at ghosty position; fall back to a filled circle with eyes if image fails to load
    - _Requirements: 9.2_
  - [x] 8.3 Implement `Renderer.drawPipes(pipes, canvas, scoreBarHeight)` — green fill, hand-drawn outline style, top pipe from canvas top, bottom pipe from score bar
    - _Requirements: 4.3, 9.3_
  - [x] 8.4 Implement `Renderer.drawClouds(clouds)` — white rounded rectangles with sketchy outline
    - _Requirements: 5.3, 9.4_
  - [x] 8.5 Implement `Renderer.drawScoreBar(canvas, score, highScore)` — dark strip at canvas bottom, retro font, format "Score: X | High: X"
    - _Requirements: 7.2, 9.5, 9.6_
  - [ ]* 8.6 Write property test for score display format (Property 12)
    - **Property 12: Score display format is correct for all values**
    - **Validates: Requirements 7.2**
  - [x] 8.7 Implement `Renderer.drawIdleScreen(canvas)` — overlay prompting player to flap to begin
    - _Requirements: 10.1_
  - [x] 8.8 Implement `Renderer.drawGameOverScreen(canvas, score)` — "Game Over" overlay with final score and restart prompt
    - _Requirements: 10.3, 10.4_
  - [ ]* 8.9 Write property test for game over screen containing final score (Property 16)
    - **Property 16: Game over screen contains the final score**
    - **Validates: Requirements 10.4**
  - [x]* 8.10 Write unit tests for Renderer
    - Test idle screen is drawn on init; test game over screen contains "Game Over"; test ghosty fallback renders without crash
    - _Requirements: 9.2, 10.1, 10.3_

- [x] 9. Implement AABB collision detection
  - [x] 9.1 Implement `aabbOverlap(a, b)` pure function taking two `{x, y, width, height}` rectangles and returning a boolean
    - _Requirements: 6.4_
  - [ ]* 9.2 Write property test for AABB correctness (Property 10)
    - **Property 10: AABB collision detection correctness**
    - **Validates: Requirements 6.1, 6.3, 6.4**

- [x] 10. Implement `Game` coordinator and game loop
  - [x] 10.1 Implement `Game.init()` — create canvas, set up `GameState`, bind `InputHandler`, load assets, call `ScoreManager.loadHighScore()`, call `Renderer.drawIdleScreen()`
    - _Requirements: 1.1, 1.2, 1.3, 10.1_
  - [x] 10.2 Implement the `Game_Loop` using `requestAnimationFrame` — call `update(dt)` then `render()` each frame; skip frame if canvas dimensions are 0
    - _Requirements: 1.2_
  - [x] 10.3 Implement `Game.update(dt)` — consume flap input and dispatch to state machine; call `PhysicsEngine`, `ObstacleManager`, `ScoreManager`, collision detection in order; transition to `game_over` on collision or boundary
    - _Requirements: 2.1, 2.3, 3.4, 3.5, 3.6, 4.2, 6.1, 6.2, 6.3_
  - [x] 10.4 Implement `Game.start()`, `Game.restart()`, and `Game.gameOver()` state transitions — `restart()` resets obstacles, Ghosty position, and score; `gameOver()` plays game over sound
    - _Requirements: 8.2, 10.2, 10.5_
  - [ ]* 10.5 Write property test for full game reset (Property 17)
    - **Property 17: Full game reset restores initial state**
    - **Validates: Requirements 10.5**
  - [ ]* 10.6 Write unit tests for game state transitions
    - Test idle → playing on flap; test playing → game_over on collision; test game_over → playing on flap; test `playJump()` called during playing state flap
    - _Requirements: 3.4, 3.5, 3.6, 8.1, 10.2_

- [x] 11. Implement canvas resize handling
  - [x] 11.1 Add `window.resize` listener that sets `canvas.width`/`canvas.height` to `window.innerWidth`/`window.innerHeight`, recomputes scaled constants, and repositions Ghosty and all active obstacles proportionally
    - _Requirements: 1.3, 1.4_
  - [ ]* 11.2 Write unit tests for canvas resize
    - Test canvas dimensions match window after resize event; test scaled constants recomputed
    - _Requirements: 1.3, 1.4_

- [x] 12. Wire everything together in `index.html`
  - [x] 12.1 Ensure all component objects are defined in the correct dependency order within the `<script>` block and `Game.init()` is called on `DOMContentLoaded`
    - _Requirements: 1.1, 1.2_
  - [x] 12.2 Verify `AudioManager.unlock()` is called on the first user interaction event so audio plays correctly after the first flap
    - _Requirements: 8.3_

- [x] 13. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Mobile Bug Fix Tasks

- [x] 14. Fix touch input double-flap on mobile
  - Update `InputHandler.bind()` to call `e.preventDefault()` on the `touchstart` event handler to suppress the synthetic `click` event that fires after a touch
  - This prevents both `touchstart` and `click` from firing for the same tap, eliminating the double-flap bug
  - _Requirements: 3.3_

- [x] 15. Make clouds decorative — remove collision, add semi-transparency
  - Remove cloud collision detection from `Game.update()` — clouds no longer cause game over
  - Update `Renderer.drawClouds()` to set `ctx.globalAlpha = 0.4` before drawing and restore it to `1` after
  - _Requirements: 5.3, 6.1_

- [x] 16. Tune physics constants for mobile
  - Update `getScaledConstants` to use `gapSize: 180 * scale` (was `160 * scale`)
  - Update `getScaledConstants` to include `pipeInterval: 220 * scale` so pipe spawn frequency scales with canvas height
  - _Requirements: 1.4, 4.1_

- [x] 17. Final checkpoint — run all tests and verify fixes
  - Run `npm test` and confirm all tests pass
  - Manually verify on a mobile viewport: single flap per tap, clouds are semi-transparent and non-lethal, pipe gaps feel generous

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties (17 total)
- Unit tests validate specific examples, state transitions, and error paths
- Run tests with: `npx vitest --run`
