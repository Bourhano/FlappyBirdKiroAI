// Property-based tests for ScoreManager
import { describe, it, beforeEach } from 'vitest';
import fc from 'fast-check';

// Inline ScoreManager since index.html is not an ES module
function makeScoreManager() {
  return {
    score: 0,
    highScore: 0,
    loadHighScore() {
      try {
        this.highScore = parseInt(localStorage.getItem('flappyKiroHighScore')) || 0;
      } catch {
        this.highScore = 0;
      }
    },
    saveHighScore() {
      try {
        localStorage.setItem('flappyKiroHighScore', this.highScore);
      } catch { /* in-memory only */ }
    },
    checkPipeCrossing(ghosty, pipes) {
      for (const pipe of pipes) {
        if (!pipe.scored && ghosty.x > pipe.x + pipe.width) {
          pipe.scored = true;
          this.incrementScore();
        }
      }
    },
    incrementScore() {
      this.score++;
      if (this.score > this.highScore) {
        this.highScore = this.score;
        this.saveHighScore();
      }
    },
    reset() {
      this.score = 0;
    },
  };
}

describe('ScoreManager properties', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('Property 11: Score increments exactly once per pipe crossing', () => {
    // Feature: flappy-kiro, Property 11: Score increments exactly once per pipe crossing
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 500 }),  // pipe.x
        fc.integer({ min: 10, max: 100 }), // pipe.width
        (pipeX, pipeWidth) => {
          const sm = makeScoreManager();
          const ghosty = { x: pipeX + pipeWidth + 1, width: 48 };
          const pipe = { x: pipeX, width: pipeWidth, scored: false };
          const pipes = [pipe];

          sm.checkPipeCrossing(ghosty, pipes);
          const scoreAfterFirst = sm.score;
          const scoredAfterFirst = pipe.scored;

          sm.checkPipeCrossing(ghosty, pipes);
          const scoreAfterSecond = sm.score;

          return scoreAfterFirst === 1 && scoredAfterFirst === true && scoreAfterSecond === 1;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 13: High score updates when current score exceeds it', () => {
    // Feature: flappy-kiro, Property 13: High score updates when current score exceeds it
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000 }), // highScore h
        fc.integer({ min: 0, max: 1000 }), // score s (will be set to h so next increment exceeds)
        (h, s) => {
          const sm = makeScoreManager();
          sm.highScore = h;
          sm.score = h; // score equals highScore, next increment will exceed it
          sm.incrementScore(); // score becomes h+1 > h
          return sm.highScore === h + 1;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 14: High score localStorage round-trip', () => {
    // Feature: flappy-kiro, Property 14: High score localStorage round-trip
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100000 }),
        (h) => {
          const sm = makeScoreManager();
          sm.highScore = h;
          sm.saveHighScore();
          const sm2 = makeScoreManager();
          sm2.loadHighScore();
          return sm2.highScore === h;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 15: Reset clears score but retains high score', () => {
    // Feature: flappy-kiro, Property 15: Reset clears score but retains high score
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10000 }), // highScore h
        fc.integer({ min: 0, max: 10000 }), // current score
        (h, currentScore) => {
          const sm = makeScoreManager();
          sm.highScore = h;
          sm.score = currentScore;
          sm.reset();
          return sm.score === 0 && sm.highScore === h;
        }
      ),
      { numRuns: 100 }
    );
  });
});
