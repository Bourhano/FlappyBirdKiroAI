# Flappy Kiro

A retro browser-based endless scroller game. The player controls "Ghosty", a ghost character that must navigate through gaps in pipes and avoid clouds by tapping/clicking/pressing space to flap upward against gravity.

## Core Gameplay
- Single-screen canvas game running in the browser
- Three game phases: `idle`, `playing`, `game_over`
- Score increments each time Ghosty passes through a pipe gap
- High score is persisted to `localStorage`
- Fully responsive — all game constants scale proportionally to canvas height (reference height: 600px)

## Assets
- `assets/ghosty.png` — player sprite (falls back to a white circle with eyes if missing)
- `assets/jump.wav` — flap sound effect
- `assets/game_over.wav` — game over sound effect
