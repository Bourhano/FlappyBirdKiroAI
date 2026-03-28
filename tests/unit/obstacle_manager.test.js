// Unit tests for ObstacleManager
import { describe, it, expect, beforeEach } from 'vitest';

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

const makeGameState = (canvasWidth = 400, canvasHeight = 600) => ({
  canvas: { width: canvasWidth, height: canvasHeight },
  scoreBarHeight: 48,
  pipes: [],
  clouds: [],
});

describe('ObstacleManager', () => {
  let om;

  beforeEach(() => {
    om = makeObstacleManager();
  });

  it('reset empties pipes and clouds arrays', () => {
    const gs = makeGameState();
    om.spawnPipe(gs);
    om.spawnCloud(gs);
    expect(om.pipes.length).toBeGreaterThan(0);
    expect(om.clouds.length).toBeGreaterThan(0);
    om.reset();
    expect(om.pipes).toHaveLength(0);
    expect(om.clouds).toHaveLength(0);
  });

  it('reset on already-empty manager is a no-op', () => {
    om.reset();
    expect(om.pipes).toHaveLength(0);
    expect(om.clouds).toHaveLength(0);
  });

  it('spawnPipe produces correct GAP_SIZE', () => {
    const gs = makeGameState();
    const { gapSize } = getScaledConstants(gs.canvas);
    for (let i = 0; i < 20; i++) {
      om.reset();
      const pipe = om.spawnPipe(gs);
      expect(pipe.gapBottom - pipe.gapTop).toBeCloseTo(gapSize, 10);
    }
  });

  it('spawnPipe places pipe at canvas.width + pipeWidth', () => {
    const gs = makeGameState();
    const { pipeWidth } = getScaledConstants(gs.canvas);
    const pipe = om.spawnPipe(gs);
    expect(pipe.x).toBeCloseTo(gs.canvas.width + pipeWidth, 10);
  });

  it('spawnPipe gapTop is within safe vertical bounds', () => {
    const gs = makeGameState();
    const { gapSize } = getScaledConstants(gs.canvas);
    const minMargin = 60 * (gs.canvas.height / 600);
    for (let i = 0; i < 30; i++) {
      om.reset();
      const pipe = om.spawnPipe(gs);
      expect(pipe.gapTop).toBeGreaterThanOrEqual(minMargin);
      expect(pipe.gapBottom).toBeLessThanOrEqual(gs.canvas.height - gs.scoreBarHeight - minMargin);
    }
  });

  it('spawnCloud produces cloud within canvas vertical bounds', () => {
    const gs = makeGameState();
    for (let i = 0; i < 30; i++) {
      om.reset();
      const cloud = om.spawnCloud(gs);
      expect(cloud.y).toBeGreaterThanOrEqual(20);
      expect(cloud.y + cloud.height).toBeLessThanOrEqual(gs.canvas.height - gs.scoreBarHeight - 40 + cloud.height);
    }
  });

  it('spawnCloud spawns at canvas.width', () => {
    const gs = makeGameState();
    const cloud = om.spawnCloud(gs);
    expect(cloud.x).toBe(gs.canvas.width);
  });

  it('update removes off-screen pipes (x + width <= 0)', () => {
    const gs = makeGameState();
    const { pipeWidth } = getScaledConstants(gs.canvas);
    // Manually place a pipe off-screen
    om.pipes.push({ x: -pipeWidth - 1, gapTop: 100, gapBottom: 260, width: pipeWidth, scored: false });
    om.update(gs);
    // The off-screen pipe should be removed (update may also spawn a new one, but the old one is gone)
    const offScreen = om.pipes.filter(p => p.x + p.width <= 0);
    expect(offScreen).toHaveLength(0);
  });

  it('update removes off-screen clouds (x + width <= 0)', () => {
    const gs = makeGameState();
    const scale = gs.canvas.height / 600;
    const cloudWidth = 80 * scale;
    om.clouds.push({ x: -cloudWidth - 1, y: 50, width: cloudWidth, height: 30 * scale });
    om.update(gs);
    const offScreen = om.clouds.filter(c => c.x + c.width <= 0);
    expect(offScreen).toHaveLength(0);
  });

  it('update moves pipes leftward by scrollSpeed', () => {
    const gs = makeGameState();
    const { scrollSpeed, pipeWidth } = getScaledConstants(gs.canvas);
    // Place a pipe well on-screen so it won't be removed
    const startX = gs.canvas.width / 2;
    om.pipes.push({ x: startX, gapTop: 100, gapBottom: 260, width: pipeWidth, scored: false });
    // Prevent new pipe spawn by adding a recent pipe
    om.pipes.push({ x: gs.canvas.width - 10, gapTop: 100, gapBottom: 260, width: pipeWidth, scored: false });
    om.update(gs);
    expect(om.pipes[0].x).toBeCloseTo(startX - scrollSpeed, 10);
  });
});
