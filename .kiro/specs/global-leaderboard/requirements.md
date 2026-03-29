# Requirements Document

## Introduction

The Global Leaderboard feature extends Flappy Kiro with a persistent, cross-player leaderboard backed by Firebase Firestore. On first visit, the player enters a nickname that is stored in localStorage so they are not prompted again on return visits. After every game over, the player's score is submitted to Firestore and the top scores across all players are displayed. Because the game is a static site hosted on GitHub Pages, all Firebase interaction happens client-side via the Firebase JavaScript SDK loaded from CDN.

## Glossary

- **Game**: The Flappy Kiro browser application (single `index.html`, no build step)
- **Leaderboard**: The ranked list of top scores across all players, sourced from Firestore
- **Leaderboard_Manager**: The client-side component responsible for reading and writing leaderboard data to Firestore
- **Nickname_Manager**: The component responsible for prompting, validating, persisting, and retrieving the player's nickname via localStorage
- **Nickname**: A player-chosen display name, 1–20 characters, stored in localStorage under the key `flappyKiroNickname`
- **Score_Entry**: A Firestore document containing `{ nickname: string, score: number, timestamp: number }` written to the `scores` collection
- **Nickname_Screen**: The full-screen overlay shown on first load that prompts the player to enter a nickname before playing
- **Leaderboard_Screen**: The full-screen overlay shown after every game over that displays the top scores and a prompt to play again
- **Firebase_SDK**: The Firebase JavaScript SDK (v9 compat or modular) loaded via CDN `<script>` tag — no npm bundler involved
- **Firestore**: The Firebase Firestore database used as the backend for Score_Entry persistence and retrieval
- **Top_N**: The maximum number of entries shown on the Leaderboard_Screen (10 entries)

## Requirements

### Requirement 1: Firebase SDK Integration

**User Story:** As a developer, I want Firebase loaded via CDN script tags, so that the static GitHub Pages site can communicate with Firestore without a build step or npm bundler.

#### Acceptance Criteria

1. THE Game SHALL load the Firebase_SDK by including CDN `<script>` tags for `firebase-app-compat` and `firebase-firestore-compat` in `index.html` before the game script.
2. THE Game SHALL initialize the Firebase app exactly once using the project configuration values (`apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`).
3. IF the Firebase_SDK fails to load (e.g., network error), THEN THE Game SHALL continue to function in offline mode with the leaderboard features disabled and no uncaught JavaScript errors thrown.

---

### Requirement 2: Nickname Prompt on First Visit

**User Story:** As a player, I want to enter a nickname the first time I visit, so that my scores appear under my chosen name on the leaderboard.

#### Acceptance Criteria

1. WHEN the Game first loads and no nickname is found in localStorage, THE Nickname_Manager SHALL display the Nickname_Screen before the idle game screen.
2. THE Nickname_Screen SHALL contain a text input field and a confirm button that the player must interact with to proceed.
3. WHEN the player submits the Nickname_Screen, THE Nickname_Manager SHALL validate that the nickname is between 1 and 20 characters (inclusive) after trimming leading and trailing whitespace.
4. IF the trimmed nickname is empty or exceeds 20 characters, THEN THE Nickname_Manager SHALL display an inline validation error and SHALL NOT dismiss the Nickname_Screen.
5. WHEN a valid nickname is confirmed, THE Nickname_Manager SHALL persist the trimmed nickname to localStorage under the key `flappyKiroNickname` and dismiss the Nickname_Screen.
6. WHEN the Game loads and a nickname already exists in localStorage, THE Nickname_Manager SHALL skip the Nickname_Screen entirely and proceed directly to the idle game screen.

---

### Requirement 3: Nickname Persistence

**User Story:** As a returning player, I want my nickname remembered across visits, so that I don't have to re-enter it every time I play.

#### Acceptance Criteria

1. THE Nickname_Manager SHALL read the player's nickname from localStorage under the key `flappyKiroNickname` on every page load.
2. WHEN a nickname is found in localStorage, THE Nickname_Manager SHALL make it available to the Leaderboard_Manager for use in Score_Entry submissions without prompting the player.
3. IF localStorage is unavailable (e.g., private browsing mode), THEN THE Nickname_Manager SHALL fall back to prompting the player for a nickname each session and SHALL NOT throw an uncaught error.

---

### Requirement 4: Score Submission

**User Story:** As a player, I want my score automatically submitted after each game over, so that my result appears on the global leaderboard.

#### Acceptance Criteria

1. WHEN the Game transitions to the `game_over` phase, THE Leaderboard_Manager SHALL submit a Score_Entry document to the Firestore `scores` collection containing `nickname` (string), `score` (non-negative integer), and `timestamp` (Unix epoch milliseconds as a number).
2. THE Leaderboard_Manager SHALL submit the Score_Entry before fetching the updated leaderboard data for display.
3. IF the Firestore write fails (e.g., network unavailable), THEN THE Leaderboard_Manager SHALL proceed to display the Leaderboard_Screen using the most recently fetched leaderboard data and SHALL NOT block the game over flow.
4. THE Leaderboard_Manager SHALL NOT submit a Score_Entry with a score of 0 — a zero score SHALL be silently skipped.

---

### Requirement 5: Leaderboard Retrieval

**User Story:** As a player, I want to see the top scores from all players after each game over, so that I know how I rank globally.

#### Acceptance Criteria

1. WHEN the Game transitions to the `game_over` phase, THE Leaderboard_Manager SHALL query the Firestore `scores` collection for the top 10 Score_Entry documents ordered by `score` descending.
2. THE Leaderboard_Manager SHALL display the Leaderboard_Screen once the query resolves (or after a timeout of 5 seconds, whichever comes first).
3. IF the Firestore query fails or times out, THEN THE Leaderboard_Manager SHALL display the Leaderboard_Screen with a "Could not load leaderboard" message in place of the score list.
4. THE Leaderboard_Manager SHALL include all players' scores in the query results, including the score just submitted in the current session.

---

### Requirement 6: Leaderboard Display

**User Story:** As a player, I want to see a clear, ranked leaderboard after each game over, so that I can compare my performance against other players.

#### Acceptance Criteria

1. THE Leaderboard_Screen SHALL display up to 10 entries, each showing the player's rank (1–10), nickname, and score.
2. THE Leaderboard_Screen SHALL visually highlight the current player's own entry if it appears in the top 10, using a distinct color or style.
3. THE Leaderboard_Screen SHALL display the current player's score for the just-completed session regardless of whether it appears in the top 10.
4. THE Leaderboard_Screen SHALL display a "Play Again" prompt that the player can activate via tap, click, or spacebar to restart the game.
5. WHEN the player activates the "Play Again" prompt on the Leaderboard_Screen, THE Game SHALL transition to the `playing` phase and reset all game state as defined in the existing game over restart flow.
6. THE Leaderboard_Screen SHALL be rendered on the HTML5 Canvas using the same retro monospace font and dark overlay style consistent with the existing game over screen aesthetic.

---

### Requirement 7: Leaderboard Data Integrity

**User Story:** As a player, I want the leaderboard to reflect genuine scores, so that the rankings are meaningful.

#### Acceptance Criteria

1. THE Leaderboard_Manager SHALL only write Score_Entry documents that contain all three required fields: `nickname`, `score`, and `timestamp`.
2. THE Leaderboard_Manager SHALL ensure the `score` field in every submitted Score_Entry is a non-negative integer.
3. THE Leaderboard_Manager SHALL ensure the `nickname` field in every submitted Score_Entry is a non-empty string of at most 20 characters.
4. THE Leaderboard_Manager SHALL ensure the `timestamp` field in every submitted Score_Entry equals `Date.now()` at the time of submission.

---

### Requirement 8: Offline and Error Resilience

**User Story:** As a player on an unreliable connection, I want the game to remain playable even when Firebase is unavailable, so that connectivity issues don't break the core experience.

#### Acceptance Criteria

1. WHILE Firebase is unavailable, THE Game SHALL remain fully playable with all core mechanics (physics, obstacles, scoring, sound) functioning normally.
2. IF a Firestore operation (read or write) throws an error, THEN THE Leaderboard_Manager SHALL catch the error, log it to the browser console, and SHALL NOT propagate it as an uncaught exception.
3. WHILE the Leaderboard_Manager is waiting for a Firestore response, THE Leaderboard_Screen SHALL display a loading indicator in place of the score list.
4. IF the Firebase_SDK is not initialized (e.g., CDN script failed to load), THEN THE Leaderboard_Manager SHALL detect the missing global and disable all Firestore operations silently.
