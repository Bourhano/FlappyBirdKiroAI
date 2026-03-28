// Unit tests for InputHandler
import { describe, it, expect, beforeEach } from 'vitest';

// Inline InputHandler implementation (mirrors index.html)
const InputHandler = {
  pendingFlap: false,
  bind(canvas) {
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.key === ' ') this.pendingFlap = true;
    });
    canvas.addEventListener('click', () => { this.pendingFlap = true; });
    canvas.addEventListener('touchstart', () => { this.pendingFlap = true; });
  },
  consumeFlap() {
    if (this.pendingFlap) {
      this.pendingFlap = false;
      return true;
    }
    return false;
  },
};

describe('InputHandler', () => {
  let canvas;

  beforeEach(() => {
    InputHandler.pendingFlap = false;
    canvas = document.createElement('canvas');
    InputHandler.bind(canvas);
  });

  it('spacebar keydown sets pendingFlap to true', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
    expect(InputHandler.pendingFlap).toBe(true);
  });

  it('space key (event.key) sets pendingFlap to true', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
    expect(InputHandler.pendingFlap).toBe(true);
  });

  it('click on canvas sets pendingFlap to true', () => {
    canvas.dispatchEvent(new MouseEvent('click'));
    expect(InputHandler.pendingFlap).toBe(true);
  });

  it('touchstart on canvas sets pendingFlap to true', () => {
    canvas.dispatchEvent(new Event('touchstart'));
    expect(InputHandler.pendingFlap).toBe(true);
  });

  it('consumeFlap returns true and clears the flag when pending', () => {
    InputHandler.pendingFlap = true;
    expect(InputHandler.consumeFlap()).toBe(true);
    expect(InputHandler.pendingFlap).toBe(false);
  });

  it('consumeFlap returns false when not pending', () => {
    expect(InputHandler.consumeFlap()).toBe(false);
  });

  it('deduplication: multiple events before consumeFlap result in one flap', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
    canvas.dispatchEvent(new MouseEvent('click'));
    canvas.dispatchEvent(new Event('touchstart'));

    expect(InputHandler.consumeFlap()).toBe(true);
    expect(InputHandler.consumeFlap()).toBe(false);
  });
});
