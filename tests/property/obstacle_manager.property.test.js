// Property-based tests for ObstacleManager
import { describe, it } from 'vitest';
import fc from 'fast-check';

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

function makeObstacleManager() {
  return {
    PIPE_INTERVAL: 220,
    SCROLL_SPEED: 3,
    GAP_SIZE: 160,
    pipes: [],
    clouds: [],

    spawnPipe(gameState) {
      const { canvas, scoreBarHeight } = gameState;
      const { gapSize, pipeWidth } = getScaledConstants(canvas);
      const minMargin = 60 * (canvas.height / 600);
      const maxGapTop = canvas.height - scoreBarHeight - gapSize - minMargin;
      const gapTop = minMargin + Math.random() * (maxGapTop - minMargin);
      const gapBottom = gapTop + gapSize;
      const pipe = {
        x: canvas.width + pipeWidth,
        gapTop,
        gapBottom,
        width: pipeWidth,
        scored: false,
      };
      this.pipes.push(pipe);
      return pipe;
    },

    spawnCloud(gameState) {
      const { canvas, scoreBarHeight } = gameState;
      const scale = canvas.height / 600;
      const cloudWidth = 80 * scale;
      const cloudHeight = 30 * scale;
      const minY = 20;
      const maxY = canvas.height - scoreBarHeight - 40 - cloudHeight;
      const y = minY + Math.random() * (maxY - minY);
      const cloud = {
        x: canvas.width,
        y,
        width: cloudWidth,
        height: cloudHeight,
      };
      this.clouds.push(cloud);
      return cloud;
    },

    update(gameState) {
      const { canvas } = gameState;
      const { scrollSpeed } = getScaledConstants(canvas);
      const pipeInterval = this.PIPE_INTERVAL * (canvas.height / 600);

      for (const pipe of this.pipes) pipe.x -= scrollSpeed;
      for (const cloud of this.clouds) cloud.x -= scrollSpeed;

      this.pipes = this.pipes.filter(p => p.x + p.width > 0);
      this.clouds = this.clouds.filter(c => c.x + c.width > 0);

      const lastPipe = this.pipes[this.pipes.length - 1];
      if (!lastPipe || lastPipe.x <= canvas.width - pipeInterval) {
        this.spawnPipe(gameState);
        if (Math.random() < 0.4) this.spawnCloud(gameState);
      }
    },

    reset() {
      this.pipes = [];
      this.clouds = [];
    },
  };
}

// Arbitrary for a valid canvas size (height must be large enough for safe pipe margins)
const canvasArb = fc.record({
  width: fc.integer({ min: 300, max: 1200 }),
  height: fc.integer({ min: 400, max: 900 }),
});

describe('ObstacleManager properties', () => {
  it('Property 5: Pipe gap size is always GAP_SIZE', () => {
    // Feature: flappy-kiro, Property 5: Pipe gap size is always GAP_SIZE
    fc.assert(
      fc.property(canvasArb, (canvas) => {
        const { gapSize } = getScaledConstants(canvas);
        const scoreBarHeight = getScaledConstants(canvas).scoreBarHeight;
        const gs = { canvas, scoreBarHeight };
        const om = makeObstacleManager();
        const pipe = om.spawnPipe(gs);
        return Math.abs((pipe.gapBottom - pipe.gapTop) - gapSize) < 1e-9;
      }),
      { numRuns: 100 }
    );
  });

  it('Property 6: Pipe gap is always within safe vertical bounds', () => {
    // Feature: flappy-kiro, Property 6: Pipe gap is always within safe vertical bounds
    fc.assert(
      fc.property(canvasArb, (canvas) => {
        const { gapSize, scoreBarHeight } = getScaledConstants(canvas);
        const minMargin = 60 * (canvas.height / 600);
        const gs = { canvas, scoreBarHeight };
        const om = makeObstacleManager();
        const pipe = om.spawnPipe(gs);
        return (
          pipe.gapTop >= minMargin &&
          pipe.gapBottom <= canvas.height - scoreBarHeight - minMargin
        );
      }),
      { numRuns: 100 }
    );
  });

  it('Property 8: All obstacles scroll leftward at SCROLL_SPEED per frame', () => {
    // Feature: flappy-kiro, Property 8: All obstacles scroll leftward at SCROLL_SPEED per frame
    fc.assert(
      fc.property(
        canvasArb,
        fc.integer({ min: 1, max: 5 }), // number of pipes
        fc.integer({ min: 1, max: 5 }), // number of clouds
        (canvas, numPipes, numClouds) => {
          const { scrollSpeed, pipeWidth, scoreBarHeight } = getScaledConstants(canvas);
          const gs = { canvas, scoreBarHeight };
          const om = makeObstacleManager();

          // Manually place pipes and clouds well on-screen
          for (let i = 0; i < numPipes; i++) {
            om.pipes.push({ x: canvas.width / 2 + i * 50, gapTop: 100, gapBottom: 260, width: pipeWidth, scored: false });
          }
          for (let i = 0; i < numClouds; i++) {
            om.clouds.push({ x: canvas.width / 2 + i * 50, y: 50, width: 80, height: 30 });
          }

          const pipesBefore = om.pipes.map(p => p.x);
          const cloudsBefore = om.clouds.map(c => c.x);

          // Prevent auto-spawn by adding a recent pipe at the right edge
          om.pipes.push({ x: canvas.width - 10, gapTop: 100, gapBottom: 260, width: pipeWidth, scored: false });

          om.update(gs);

          // Check all original pipes moved by scrollSpeed
          for (let i = 0; i < numPipes; i++) {
            const pipe = om.pipes.find((p, idx) => Math.abs(p.x - (pipesBefore[i] - scrollSpeed)) < 1e-9);
            if (!pipe) return false;
          }
          // Check all original clouds moved by scrollSpeed
          for (let i = 0; i < numClouds; i++) {
            const cloud = om.clouds.find(c => Math.abs(c.x - (cloudsBefore[i] - scrollSpeed)) < 1e-9);
            if (!cloud) return false;
          }
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 9: Off-screen obstacles are removed after update', () => {
    // Feature: flappy-kiro, Property 9: Off-screen obstacles are removed after update
    fc.assert(
      fc.property(
        canvasArb,
        fc.integer({ min: 1, max: 5 }),
        (canvas, count) => {
          const { pipeWidth, scoreBarHeight } = getScaledConstants(canvas);
          const gs = { canvas, scoreBarHeight };
          const om = makeObstacleManager();
          const scale = canvas.height / 600;
          const cloudWidth = 80 * scale;

          // Place obstacles just off-screen (x + width <= 0)
          for (let i = 0; i < count; i++) {
            om.pipes.push({ x: -pipeWidth - 1 - i, gapTop: 100, gapBottom: 260, width: pipeWidth, scored: false });
            om.clouds.push({ x: -cloudWidth - 1 - i, y: 50, width: cloudWidth, height: 30 * scale });
          }

          om.update(gs);

          const offScreenPipes = om.pipes.filter(p => p.x + p.width <= 0);
          const offScreenClouds = om.clouds.filter(c => c.x + c.width <= 0);
          return offScreenPipes.length === 0 && offScreenClouds.length === 0;
        }
      ),
      { numRuns: 100 }
    );
  });
});
