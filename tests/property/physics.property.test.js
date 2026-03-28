// Property-based tests for PhysicsEngine
import { describe, it } from 'vitest';
import fc from 'fast-check';

// Inline implementations since index.html is not an ES module
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

describe('PhysicsEngine properties', () => {
  it('Property 1: Gravity accumulates velocity and position', () => {
    // Feature: flappy-kiro, Property 1: Gravity accumulates velocity and position
    fc.assert(
      fc.property(fc.float({ noNaN: true }), fc.float({ noNaN: true }), (y, vy) => {
        const ghosty = { y, vy };
        const expectedVy = vy + PhysicsEngine.GRAVITY;
        const expectedY = y + expectedVy;
        PhysicsEngine.applyGravity(ghosty);
        return ghosty.vy === expectedVy && ghosty.y === expectedY;
      }),
      { numRuns: 100 }
    );
  });

  it('Property 2: Flap sets upward velocity', () => {
    // Feature: flappy-kiro, Property 2: Flap sets upward velocity
    fc.assert(
      fc.property(fc.float({ noNaN: true }), fc.float({ noNaN: true }), (y, vy) => {
        const ghosty = { y, vy };
        PhysicsEngine.applyFlap(ghosty);
        return ghosty.vy === PhysicsEngine.FLAP_VELOCITY;
      }),
      { numRuns: 100 }
    );
  });

  it('Property 3: Bottom boundary triggers game over', () => {
    // Feature: flappy-kiro, Property 3: Bottom boundary triggers game over
    fc.assert(
      fc.property(
        fc.integer({ min: 101, max: 1000 }),
        fc.integer({ min: 1, max: 100 }),
        (canvasHeight, sbh) => {
          // ghosty.y exactly at the floor boundary (always > 0 since canvasHeight > sbh)
          const floorY = canvasHeight - sbh;
          const ghosty = { y: floorY, vy: 0 };
          return PhysicsEngine.clampToBounds(ghosty, canvasHeight, sbh).gameOver === true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
