// Unit tests for AudioManager
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Inline AudioManager implementation (mirrors index.html)
function makeAudioManager() {
  return {
    jumpSound: { currentTime: 0, play: vi.fn().mockResolvedValue(undefined) },
    gameOverSound: { currentTime: 0, play: vi.fn().mockResolvedValue(undefined) },
    unlocked: false,
    unlock() {
      this.unlocked = true;
    },
    playJump() {
      if (!this.unlocked) return;
      try {
        this.jumpSound.currentTime = 0;
        this.jumpSound.play();
      } catch(e) { /* silent */ }
    },
    playGameOver() {
      if (!this.unlocked) return;
      try {
        this.gameOverSound.currentTime = 0;
        this.gameOverSound.play();
      } catch(e) { /* silent */ }
    },
  };
}

describe('AudioManager', () => {
  let AudioManager;

  beforeEach(() => {
    AudioManager = makeAudioManager();
  });

  it('playJump() is a no-op before unlock — play() not called', () => {
    AudioManager.playJump();
    expect(AudioManager.jumpSound.play).not.toHaveBeenCalled();
  });

  it('playGameOver() is a no-op before unlock — play() not called', () => {
    AudioManager.playGameOver();
    expect(AudioManager.gameOverSound.play).not.toHaveBeenCalled();
  });

  it('after unlock(), playJump() calls play() on jumpSound', () => {
    AudioManager.unlock();
    AudioManager.playJump();
    expect(AudioManager.jumpSound.play).toHaveBeenCalledOnce();
  });

  it('after unlock(), playGameOver() calls play() on gameOverSound', () => {
    AudioManager.unlock();
    AudioManager.playGameOver();
    expect(AudioManager.gameOverSound.play).toHaveBeenCalledOnce();
  });

  it('audio play failure does not crash — exception is caught silently', () => {
    AudioManager.jumpSound.play = vi.fn().mockImplementation(() => { throw new Error('NotAllowedError'); });
    AudioManager.unlock();
    expect(() => AudioManager.playJump()).not.toThrow();
  });

  it('audio gameOver play failure does not crash — exception is caught silently', () => {
    AudioManager.gameOverSound.play = vi.fn().mockImplementation(() => { throw new Error('NotAllowedError'); });
    AudioManager.unlock();
    expect(() => AudioManager.playGameOver()).not.toThrow();
  });
});
