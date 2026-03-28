// Unit tests for ScoreManager
import { describe, it, expect, beforeEach } from 'vitest';

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

describe('ScoreManager', () => {
  let sm;

  beforeEach(() => {
    sm = makeScoreManager();
    localStorage.clear();
  });

  it('loadHighScore degrades gracefully when localStorage throws', () => {
    const original = Object.getOwnPropertyDescriptor(window, 'localStorage');
    Object.defineProperty(window, 'localStorage', {
      get() { throw new Error('localStorage unavailable'); },
      configurable: true,
    });
    try {
      sm.loadHighScore();
      expect(sm.highScore).toBe(0);
    } finally {
      Object.defineProperty(window, 'localStorage', original);
    }
  });

  it('saveHighScore does not throw when localStorage is unavailable', () => {
    const original = Object.getOwnPropertyDescriptor(window, 'localStorage');
    Object.defineProperty(window, 'localStorage', {
      get() { throw new Error('localStorage unavailable'); },
      configurable: true,
    });
    try {
      sm.highScore = 5;
      expect(() => sm.saveHighScore()).not.toThrow();
    } finally {
      Object.defineProperty(window, 'localStorage', original);
    }
  });

  it('reset sets score to 0 but retains highScore', () => {
    sm.score = 10;
    sm.highScore = 15;
    sm.reset();
    expect(sm.score).toBe(0);
    expect(sm.highScore).toBe(15);
  });

  it('checkPipeCrossing increments score when ghosty passes a pipe', () => {
    const ghosty = { x: 200, width: 48 };
    const pipes = [{ x: 100, width: 60, scored: false }];
    sm.checkPipeCrossing(ghosty, pipes);
    expect(sm.score).toBe(1);
    expect(pipes[0].scored).toBe(true);
  });

  it('checkPipeCrossing does NOT increment score twice for the same pipe', () => {
    const ghosty = { x: 200, width: 48 };
    const pipes = [{ x: 100, width: 60, scored: false }];
    sm.checkPipeCrossing(ghosty, pipes);
    sm.checkPipeCrossing(ghosty, pipes);
    expect(sm.score).toBe(1);
  });

  it('checkPipeCrossing does not score a pipe ghosty has not yet passed', () => {
    const ghosty = { x: 50, width: 48 };
    const pipes = [{ x: 100, width: 60, scored: false }];
    sm.checkPipeCrossing(ghosty, pipes);
    expect(sm.score).toBe(0);
    expect(pipes[0].scored).toBe(false);
  });

  it('highScore updates when score exceeds it', () => {
    sm.highScore = 3;
    sm.score = 3;
    sm.incrementScore(); // score becomes 4 > highScore 3
    expect(sm.highScore).toBe(4);
  });

  it('highScore is persisted to localStorage when updated', () => {
    sm.highScore = 0;
    sm.score = 0;
    sm.incrementScore();
    expect(localStorage.getItem('flappyKiroHighScore')).toBe('1');
  });

  it('loadHighScore reads persisted value from localStorage', () => {
    localStorage.setItem('flappyKiroHighScore', '42');
    sm.loadHighScore();
    expect(sm.highScore).toBe(42);
  });
});
