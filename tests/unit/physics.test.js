// Unit tests for PhysicsEngine
import { describe, it, expect } from 'vitest';

// Inline implementations since index.html is not an ES module
function getScaledConstants(canvas) {
  const scale = canvas.height / 600;
  return {
    gravity: 0.5 * scale,
    flapVelocity: -9 * scale,
    scrollSpeed: 3 * scale,
    gapSize: 160 * scale,
    pipeWidth: 60 * scale,
    ghostyWidth: 48 * scale,
    ghostyHeight: 48 * scale,
    scoreBarHeight: 48 * scale,
  };
}

const PhysicsEngine = {
  GRAVITY: 0.5,
  FLAP_VELOCITY: -9,
  applyGravity(ghosty) {
    ghosty.vy += this.GRAVITY;
    ghosty.y += ghosty.vy;
  },
  applyFlap(ghosty) {
    ghosty.vy = this.FLAP_VELOCITY;
  },
  clampToBounds(ghosty, canvasHeight, scoreBarHeight) {
    if (ghosty.y <= 0) {
      ghosty.y = 0;
      ghosty.vy = 0;
      return { gameOver: false };
    }
    if (ghosty.y >= canvasHeight - scoreBarHeight) {
      return { gameOver: true };
    }
    return { gameOver: false };
  },
};

describe('getScaledConstants', () => {
  it('returns reference constants unchanged at height 600px (scale=1)', () => {
    const canvas = { height: 600 };
    const c = getScaledConstants(canvas);
    expect(c.gravity).toBe(0.5);
    expect(c.flapVelocity).toBe(-9);
    expect(c.scrollSpeed).toBe(3);
    expect(c.gapSize).toBe(160);
    expect(c.pipeWidth).toBe(60);
    expect(c.ghostyWidth).toBe(48);
    expect(c.ghostyHeight).toBe(48);
    expect(c.scoreBarHeight).toBe(48);
  });

  it('scales all constants proportionally at height 300px (scale=0.5)', () => {
    const canvas = { height: 300 };
    const c = getScaledConstants(canvas);
    expect(c.gravity).toBe(0.25);
    expect(c.flapVelocity).toBe(-4.5);
    expect(c.scrollSpeed).toBe(1.5);
    expect(c.gapSize).toBe(80);
  });
});

describe('PhysicsEngine', () => {
  it('applyGravity accumulates velocity and position', () => {
    const ghosty = { y: 100, vy: 0 };
    PhysicsEngine.applyGravity(ghosty);
    expect(ghosty.vy).toBe(0.5);
    expect(ghosty.y).toBe(100.5);
  });

  it('applyGravity applies to existing velocity', () => {
    const ghosty = { y: 50, vy: 2 };
    PhysicsEngine.applyGravity(ghosty);
    expect(ghosty.vy).toBe(2.5);
    expect(ghosty.y).toBe(52.5);
  });

  it('applyFlap sets vy to FLAP_VELOCITY regardless of previous vy', () => {
    const ghosty = { y: 100, vy: 10 };
    PhysicsEngine.applyFlap(ghosty);
    expect(ghosty.vy).toBe(-9);
  });

  it('clampToBounds: ceiling clamp sets y=0 and vy=0 when y <= 0', () => {
    const ghosty = { y: -5, vy: -3 };
    const result = PhysicsEngine.clampToBounds(ghosty, 600, 48);
    expect(ghosty.y).toBe(0);
    expect(ghosty.vy).toBe(0);
    expect(result).toEqual({ gameOver: false });
  });

  it('clampToBounds: floor returns gameOver: true when y >= canvasHeight - scoreBarHeight', () => {
    const ghosty = { y: 552, vy: 5 };
    const result = PhysicsEngine.clampToBounds(ghosty, 600, 48);
    expect(result).toEqual({ gameOver: true });
  });

  it('clampToBounds: returns gameOver: false when ghosty is within bounds', () => {
    const ghosty = { y: 300, vy: 2 };
    const result = PhysicsEngine.clampToBounds(ghosty, 600, 48);
    expect(result).toEqual({ gameOver: false });
  });
});
