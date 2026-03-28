# Project Structure

```
flappy-kiro/
├── index.html                  # Entire game — all logic lives here as an inline <script>
├── assets/
│   ├── ghosty.png              # Player sprite
│   ├── jump.wav                # Flap sound
│   └── game_over.wav           # Game over sound
├── tests/
│   ├── unit/                   # Vitest unit tests (one file per module)
│   │   ├── physics.test.js
│   │   ├── obstacle_manager.test.js
│   │   ├── score_manager.test.js
│   │   ├── renderer.test.js
│   │   ├── audio_manager.test.js
│   │   ├── input_handler.test.js
│   │   └── game_states.test.js
│   └── property/               # fast-check property-based tests (one file per module)
│       ├── physics.property.test.js
│       ├── collision.property.test.js
│       ├── obstacle_manager.property.test.js
│       ├── score_manager.property.test.js
│       └── renderer.property.test.js
├── vitest.config.js            # Vitest config (jsdom environment)
└── package.json
```

## Architecture

All game logic is organized as plain object literals (singletons) inside `index.html`:

| Module | Responsibility |
|---|---|
| `PhysicsEngine` | Gravity, flap velocity, boundary clamping |
| `ObstacleManager` | Pipe/cloud spawning, scrolling, culling |
| `ScoreManager` | Score tracking, high score persistence |
| `InputHandler` | Keyboard / click / touch input, flap queue |
| `AudioManager` | Sound effect playback, audio unlock |
| `Renderer` | All canvas drawing (background, pipes, clouds, ghosty, UI) |
| `Game` | Main coordinator — game loop, phase transitions, collision |
| `getScaledConstants()` | Returns all physics/layout constants scaled to canvas height |
| `aabbOverlap()` | Standalone AABB collision helper |

## Conventions

- All positional values scale relative to a **600px reference height** via `getScaledConstants(canvas)`
- Ghosty position is **center-based** (`ghosty.x/y` is the center; subtract half width/height for rect ops)
- Game state is passed as a `gameState` object to modules that need canvas/ghosty/pipe references
- Test files re-implement the module under test inline (no imports from `index.html`)
- Unit tests go in `tests/unit/`, property tests go in `tests/property/`
- Property test comments follow the format: `// Feature: flappy-kiro, Property N: <description>`
