// Property-based tests for AABB collision detection
import { describe, it } from 'vitest';
import fc from 'fast-check';

// aabbOverlap extracted from index.html for testing
function aabbOverlap(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

// Arbitrary for a positive-dimension rectangle
const rectArb = fc.record({
  x: fc.integer({ min: -1000, max: 1000 }),
  y: fc.integer({ min: -1000, max: 1000 }),
  width: fc.integer({ min: 1, max: 200 }),
  height: fc.integer({ min: 1, max: 200 }),
});

describe('AABB collision detection properties', () => {
  it('Property 10 (overlapping): aabbOverlap returns true for overlapping rectangles', () => {
    // Feature: flappy-kiro, Property 10: AABB collision detection correctness
    fc.assert(
      fc.property(
        rectArb,
        fc.record({
          width: fc.integer({ min: 1, max: 200 }),
          height: fc.integer({ min: 1, max: 200 }),
        }),
        (a, bDims) => {
          // Generate B.x in [a.x - bDims.width + 1, a.x + a.width - 1] to guarantee x-overlap
          const bx = a.x - bDims.width + 1 + Math.floor(Math.random() * (a.width + bDims.width - 2));
          // Generate B.y in [a.y - bDims.height + 1, a.y + a.height - 1] to guarantee y-overlap
          const by = a.y - bDims.height + 1 + Math.floor(Math.random() * (a.height + bDims.height - 2));
          const b = { x: bx, y: by, width: bDims.width, height: bDims.height };
          return aabbOverlap(a, b) === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 10 (x-separated): aabbOverlap returns false when B is to the right of A', () => {
    // Feature: flappy-kiro, Property 10: AABB collision detection correctness
    fc.assert(
      fc.property(
        rectArb,
        fc.record({
          width: fc.integer({ min: 1, max: 200 }),
          height: fc.integer({ min: 1, max: 200 }),
          gap: fc.integer({ min: 0, max: 100 }),
          y: fc.integer({ min: -1000, max: 1000 }),
        }),
        (a, bExtra) => {
          // B.x >= a.x + a.width  =>  no x-overlap
          const b = {
            x: a.x + a.width + bExtra.gap,
            y: bExtra.y,
            width: bExtra.width,
            height: bExtra.height,
          };
          return aabbOverlap(a, b) === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 10 (y-separated): aabbOverlap returns false when B is below A', () => {
    // Feature: flappy-kiro, Property 10: AABB collision detection correctness
    fc.assert(
      fc.property(
        rectArb,
        fc.record({
          width: fc.integer({ min: 1, max: 200 }),
          height: fc.integer({ min: 1, max: 200 }),
          gap: fc.integer({ min: 0, max: 100 }),
          x: fc.integer({ min: -1000, max: 1000 }),
        }),
        (a, bExtra) => {
          // B.y >= a.y + a.height  =>  no y-overlap
          const b = {
            x: bExtra.x,
            y: a.y + a.height + bExtra.gap,
            width: bExtra.width,
            height: bExtra.height,
          };
          return aabbOverlap(a, b) === false;
        }
      ),
      { numRuns: 100 }
    );
  });
});
