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

## Global Leaderboard
- Cross-player leaderboard backed by Firebase Firestore (client-side only, no build step)
- On first visit the player enters a nickname (stored in `localStorage` under `flappyKiroNickname`)
- After every game over, the score is submitted to Firestore and the top 10 scores are displayed
- Game phases extended to: `nickname` → `idle` → `playing` → `leaderboard` (replaces `game_over`)
- Fully resilient to Firebase/network failures — core gameplay is unaffected when offline
