# Requirements Document

## Introduction

Flappy Kiro is a retro-styled, browser-based endless scroller game. The player guides a ghost character (Ghosty) through a series of pipe obstacles and floating cloud platforms by tapping/clicking to flap. The game features a hand-drawn aesthetic, sound effects, and a persistent high score. The game runs entirely in the browser with no server-side dependencies.

## Glossary

- **Game**: The Flappy Kiro browser application
- **Ghosty**: The ghost character sprite controlled by the player, rendered using `assets/ghosty.png`
- **Pipe**: A green Mario-style obstacle pair (top pipe + bottom pipe) with a gap that Ghosty must fly through
- **Gap**: The vertical opening between a top pipe and bottom pipe through which Ghosty must pass
- **Cloud**: A floating white rounded-rectangle obstacle that Ghosty must avoid
- **Score**: The count of Pipe pairs successfully passed through during the current session
- **High_Score**: The highest Score achieved, persisted across sessions via localStorage
- **Canvas**: The HTML5 canvas element on which the game is rendered
- **Game_Loop**: The requestAnimationFrame-driven update and render cycle
- **Physics_Engine**: The component responsible for applying gravity and velocity to Ghosty
- **Obstacle_Manager**: The component responsible for spawning, moving, and despawning Pipes and Clouds
- **Score_Manager**: The component responsible for tracking Score and High_Score
- **Input_Handler**: The component responsible for detecting player input (click, tap, spacebar)
- **Audio_Manager**: The component responsible for playing sound effects
- **Renderer**: The component responsible for drawing all game elements to the Canvas

## Requirements

### Requirement 1: Core Game Loop

**User Story:** As a player, I want the game to run smoothly in my browser, so that I can enjoy a responsive gameplay experience.

#### Acceptance Criteria

1. THE Game SHALL run entirely in a web browser using HTML5, CSS, and JavaScript with no external runtime dependencies.
2. THE Game_Loop SHALL update game state and render each frame using `requestAnimationFrame`.
3. THE Canvas SHALL fill the full viewport width and height and resize when the browser window is resized.
4. WHEN the browser window is resized, THE Renderer SHALL scale all game elements proportionally to maintain consistent gameplay.

---

### Requirement 2: Ghosty Physics

**User Story:** As a player, I want Ghosty to fall under gravity and rise when I flap, so that the core mechanic feels satisfying and challenging.

#### Acceptance Criteria

1. WHILE the Game is in the playing state, THE Physics_Engine SHALL apply a constant downward gravitational acceleration to Ghosty on every frame.
2. WHEN the player provides a flap input, THE Physics_Engine SHALL apply an upward velocity impulse to Ghosty.
3. WHILE the Game is in the playing state, THE Physics_Engine SHALL update Ghosty's vertical position each frame based on current velocity.
4. IF Ghosty's vertical position reaches the top edge of the Canvas, THEN THE Physics_Engine SHALL stop Ghosty's upward movement and set vertical velocity to zero.
5. IF Ghosty's vertical position reaches the bottom score bar, THEN THE Game SHALL transition to the game over state.

---

### Requirement 3: Player Input

**User Story:** As a player, I want to control Ghosty using keyboard, mouse, or touch, so that the game is accessible on both desktop and mobile.

#### Acceptance Criteria

1. WHEN the player presses the spacebar, THE Input_Handler SHALL trigger a flap action.
2. WHEN the player clicks the Canvas, THE Input_Handler SHALL trigger a flap action.
3. WHEN the player taps the Canvas on a touch device, THE Input_Handler SHALL trigger a flap action.
4. WHEN a flap action is triggered during the playing state, THE Physics_Engine SHALL apply the upward velocity impulse to Ghosty.
5. WHEN a flap action is triggered during the game over state, THE Game SHALL restart a new session.
6. WHEN a flap action is triggered during the idle/start state, THE Game SHALL transition to the playing state.

---

### Requirement 4: Pipe Obstacles

**User Story:** As a player, I want pipes to scroll toward me continuously, so that I must navigate through gaps to survive.

#### Acceptance Criteria

1. THE Obstacle_Manager SHALL spawn Pipe pairs at regular horizontal intervals off the right edge of the Canvas.
2. WHILE the Game is in the playing state, THE Obstacle_Manager SHALL move all active Pipes leftward at a constant scroll speed each frame.
3. THE Obstacle_Manager SHALL render each Pipe pair as a top pipe extending downward from the top of the Canvas and a bottom pipe extending upward from the score bar, with a Gap between them.
4. THE Obstacle_Manager SHALL randomize the vertical position of the Gap within safe bounds so Ghosty can always pass through.
5. WHEN a Pipe pair moves entirely off the left edge of the Canvas, THE Obstacle_Manager SHALL remove it from the active obstacle list.
6. THE Renderer SHALL draw Pipes with a green, Mario-style, hand-drawn aesthetic consistent with the reference screenshot.

---

### Requirement 5: Cloud Obstacles

**User Story:** As a player, I want floating cloud obstacles in addition to pipes, so that the game has additional visual variety and challenge.

#### Acceptance Criteria

1. THE Obstacle_Manager SHALL spawn Cloud obstacles at randomized vertical positions off the right edge of the Canvas.
2. WHILE the Game is in the playing state, THE Obstacle_Manager SHALL move all active Clouds leftward at the same scroll speed as Pipes.
3. THE Renderer SHALL draw Clouds as white rounded rectangles with a sketchy, hand-drawn style.
4. WHEN Ghosty's bounding box overlaps a Cloud's bounding box, THE Game SHALL transition to the game over state.
5. WHEN a Cloud moves entirely off the left edge of the Canvas, THE Obstacle_Manager SHALL remove it from the active obstacle list.

---

### Requirement 6: Collision Detection

**User Story:** As a player, I want the game to detect when Ghosty hits an obstacle or boundary, so that the game ends fairly.

#### Acceptance Criteria

1. WHEN Ghosty's bounding box overlaps any Pipe's bounding box, THE Game SHALL transition to the game over state.
2. WHEN Ghosty's bounding box overlaps any Cloud's bounding box, THE Game SHALL transition to the game over state.
3. IF Ghosty's vertical position reaches the bottom score bar boundary, THEN THE Game SHALL transition to the game over state.
4. THE Game SHALL use axis-aligned bounding box (AABB) collision detection for all collision checks.

---

### Requirement 7: Scoring

**User Story:** As a player, I want to see my current score and all-time high score, so that I have a goal to beat.

#### Acceptance Criteria

1. WHEN Ghosty fully passes through the Gap of a Pipe pair, THE Score_Manager SHALL increment the Score by 1.
2. THE Renderer SHALL display the current Score and High_Score in a dark bottom bar in the format "Score: X | High: X".
3. WHEN the Score exceeds the stored High_Score, THE Score_Manager SHALL update the High_Score to the current Score.
4. THE Score_Manager SHALL persist the High_Score to localStorage so it survives page reloads.
5. WHEN a new game session starts, THE Score_Manager SHALL reset the Score to 0 while retaining the High_Score.

---

### Requirement 8: Sound Effects

**User Story:** As a player, I want audio feedback when I flap and when the game ends, so that the game feels more engaging.

#### Acceptance Criteria

1. WHEN a flap action is triggered during the playing state, THE Audio_Manager SHALL play the sound file `assets/jump.wav`.
2. WHEN the Game transitions to the game over state, THE Audio_Manager SHALL play the sound file `assets/game_over.wav`.
3. IF the browser has not yet received a user gesture, THEN THE Audio_Manager SHALL defer audio playback until after the first user interaction to comply with browser autoplay policies.

---

### Requirement 9: Visual Aesthetic

**User Story:** As a player, I want the game to look retro and hand-drawn, so that it has a distinctive and charming visual style.

#### Acceptance Criteria

1. THE Renderer SHALL draw the background as a light blue color with a sketchy, hand-drawn texture effect.
2. THE Renderer SHALL draw Ghosty using the sprite image `assets/ghosty.png` centered at Ghosty's position.
3. THE Renderer SHALL draw Pipes with a green fill and a slightly irregular, hand-drawn outline style.
4. THE Renderer SHALL draw Clouds as white rounded rectangles with a soft, sketchy outline.
5. THE Renderer SHALL use a pixel-art or retro-compatible font for all on-screen text.
6. THE Renderer SHALL draw the score bar as a dark-colored strip anchored to the bottom of the Canvas.

---

### Requirement 10: Game States

**User Story:** As a player, I want clear start, playing, and game over states, so that I always know what's happening in the game.

#### Acceptance Criteria

1. WHEN the Game first loads, THE Game SHALL display an idle/start screen prompting the player to flap to begin.
2. WHEN the player provides a flap input on the start screen, THE Game SHALL transition to the playing state and begin scrolling obstacles.
3. WHEN the Game transitions to the game over state, THE Renderer SHALL display a "Game Over" message overlaid on the Canvas.
4. WHEN the Game is in the game over state, THE Renderer SHALL display the final Score and a prompt to flap to restart.
5. WHEN the player provides a flap input on the game over screen, THE Game SHALL reset all obstacle positions, reset Ghosty to the starting position, and transition to the playing state.
