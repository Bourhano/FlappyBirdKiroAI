// Unit tests for Game state transitions
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Inline helpers (mirrors index.html) ────────────────────────────────────

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

function makePhysicsEngine() {
  return {
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
}

function makeObstacleManager() {
  return {
    pipes: [],
    clouds: [],
    update: vi.fn(),
    reset() {
      this.pipes = [];
      this.clouds = [];
    },
    spawnPipe: vi.fn(),
    spawnCloud: vi.fn(),
  };
}

function makeScoreManager() {
  return {
    score: 0,
    highScore: 0,
    loadHighScore: vi.fn(),
    saveHighScore: vi.fn(),
    checkPipeCrossing: vi.fn(),
    incrementScore: vi.fn(),
    reset() { this.score = 0; },
  };
}

function makeInputHandler() {
  return {
    pendingFlap: false,
    bind: vi.fn(),
    consumeFlap() {
      if (this.pendingFlap) {
        this.pendingFlap = false;
        return true;
      }
      return false;
    },
  };
}

function makeAudioManager() {
  return {
    unlocked: false,
    unlock: vi.fn(),
    playJump: vi.fn(),
    playGameOver: vi.fn(),
  };
}

function makeRenderer() {
  return {
    ctx: {},
    render: vi.fn(),
    drawIdleScreen: vi.fn(),
    drawGameOverScreen: vi.fn(),
  };
}

function aabbOverlap(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

// ─── Game factory ────────────────────────────────────────────────────────────
// Creates a self-contained Game instance with injected dependencies.
function makeGame({ canvas, PhysicsEngine, ObstacleManager, ScoreManager, InputHandler, AudioManager, Renderer } = {}) {
  const _canvas = canvas || { width: 400, height: 600 };
  const _physics = PhysicsEngine || makePhysicsEngine();
  const _obstacles = ObstacleManager || makeObstacleManager();
  const _score = ScoreManager || makeScoreManager();
  const _input = InputHandler || makeInputHandler();
  const _audio = AudioManager || makeAudioManager();
  const _renderer = Renderer || makeRenderer();

  const { ghostyWidth, ghostyHeight, scoreBarHeight } = getScaledConstants(_canvas);

  const state = {
    phase: 'idle',
    canvas: _canvas,
    scoreBarHeight,
    ghosty: {
      x: _canvas.width * 0.2,
      y: _canvas.height / 2,
      vy: 0,
      width: ghostyWidth,
      height: ghostyHeight,
    },
    pipes: _obstacles.pipes,
    clouds: _obstacles.clouds,
    score: 0,
    highScore: 0,
  };

  const Game = {
    state,

    start() {
      state.phase = 'playing';
    },

    restart() {
      _obstacles.reset();
      _score.reset();
      state.ghosty.x = _canvas.width * 0.2;
      state.ghosty.y = _canvas.height / 2;
      state.ghosty.vy = 0;
      state.pipes = _obstacles.pipes;
      state.clouds = _obstacles.clouds;
      state.score = 0;
      state.phase = 'playing';
    },

    gameOver() {
      state.phase = 'game_over';
      _audio.playGameOver();
    },

    update(dt) {
      const gs = state;
      const { canvas, ghosty, scoreBarHeight } = gs;

      if (gs.phase === 'idle') {
        if (_input.consumeFlap()) {
          _audio.unlock();
          this.start();
        }
        return;
      }

      if (gs.phase === 'playing') {
        if (_input.consumeFlap()) {
          _audio.playJump();
          _physics.applyFlap(ghosty);
        }

        _physics.applyGravity(ghosty);

        const clamp = _physics.clampToBounds(ghosty, canvas.height, scoreBarHeight);
        if (clamp.gameOver) {
          this.gameOver();
          return;
        }

        _obstacles.update(gs);
        gs.pipes = _obstacles.pipes;
        gs.clouds = _obstacles.clouds;

        _score.checkPipeCrossing(ghosty, gs.pipes);
        gs.score = _score.score;
        gs.highScore = _score.highScore;

        const ghostyRect = {
          x: ghosty.x - ghosty.width / 2,
          y: ghosty.y - ghosty.height / 2,
          width: ghosty.width,
          height: ghosty.height,
        };

        for (const pipe of gs.pipes) {
          const topRect = { x: pipe.x, y: 0, width: pipe.width, height: pipe.gapTop };
          const bottomRect = {
            x: pipe.x,
            y: pipe.gapBottom,
            width: pipe.width,
            height: canvas.height - scoreBarHeight - pipe.gapBottom,
          };
          if (aabbOverlap(ghostyRect, topRect) || aabbOverlap(ghostyRect, bottomRect)) {
            this.gameOver();
            return;
          }
        }

        for (const cloud of gs.clouds) {
          const cloudRect = { x: cloud.x, y: cloud.y, width: cloud.width, height: cloud.height };
          if (aabbOverlap(ghostyRect, cloudRect)) {
            this.gameOver();
            return;
          }
        }

        return;
      }

      if (gs.phase === 'game_over') {
        if (_input.consumeFlap()) {
          this.restart();
        }
      }
    },

    render() {
      _renderer.render(state);
    },
  };

  return { Game, state, _input, _audio, _obstacles, _score, _physics };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Game state transitions', () => {
  it('idle → playing on flap input', () => {
    const { Game, state, _input } = makeGame();
    expect(state.phase).toBe('idle');
    _input.pendingFlap = true;
    Game.update(16);
    expect(state.phase).toBe('playing');
  });

  it('playing → game_over on pipe collision', () => {
    const canvas = { width: 400, height: 600 };
    const obstacles = makeObstacleManager();
    // Place a pipe that overlaps ghosty (ghosty is at x=80, y=300, 48x48)
    // ghostyRect: x=56, y=276, w=48, h=48
    // top pipe: x=50, y=0, w=60, h=300 — overlaps ghosty
    obstacles.pipes = [{
      x: 50,
      gapTop: 300,
      gapBottom: 460,
      width: 60,
      scored: false,
    }];
    obstacles.update = vi.fn(gs => {
      gs.pipes = obstacles.pipes;
      gs.clouds = obstacles.clouds;
    });

    const { Game, state } = makeGame({ canvas, ObstacleManager: obstacles });
    state.phase = 'playing';

    Game.update(16);
    expect(state.phase).toBe('game_over');
  });

  it('game_over → playing on flap input (restart)', () => {
    const { Game, state, _input } = makeGame();
    state.phase = 'game_over';
    _input.pendingFlap = true;
    Game.update(16);
    expect(state.phase).toBe('playing');
  });

  it('playJump() is called when flap input during playing state', () => {
    const { Game, state, _input, _audio } = makeGame();
    state.phase = 'playing';
    _input.pendingFlap = true;
    Game.update(16);
    expect(_audio.playJump).toHaveBeenCalled();
  });

  it('playGameOver() is called on game over transition', () => {
    const canvas = { width: 400, height: 600 };
    const obstacles = makeObstacleManager();
    // Pipe overlapping ghosty to trigger game over
    obstacles.pipes = [{
      x: 50,
      gapTop: 300,
      gapBottom: 460,
      width: 60,
      scored: false,
    }];
    obstacles.update = vi.fn(gs => {
      gs.pipes = obstacles.pipes;
      gs.clouds = obstacles.clouds;
    });

    const { Game, state, _audio } = makeGame({ canvas, ObstacleManager: obstacles });
    state.phase = 'playing';

    Game.update(16);
    expect(_audio.playGameOver).toHaveBeenCalled();
  });

  it('restart() resets pipes to empty, score to 0, ghosty to starting position', () => {
    const canvas = { width: 400, height: 600 };
    const obstacles = makeObstacleManager();
    const score = makeScoreManager();

    const { Game, state } = makeGame({ canvas, ObstacleManager: obstacles, ScoreManager: score });

    // Simulate some game state
    state.phase = 'game_over';
    state.score = 10;
    obstacles.pipes = [{ x: 100, gapTop: 200, gapBottom: 360, width: 60, scored: true }];
    obstacles.clouds = [{ x: 200, y: 100, width: 80, height: 30 }];

    Game.restart();

    expect(state.phase).toBe('playing');
    expect(state.score).toBe(0);
    expect(state.pipes).toHaveLength(0);
    expect(state.clouds).toHaveLength(0);
    expect(state.ghosty.x).toBeCloseTo(canvas.width * 0.2);
    expect(state.ghosty.y).toBeCloseTo(canvas.height / 2);
    expect(state.ghosty.vy).toBe(0);
  });

  it('game over triggered by bottom boundary (clampToBounds)', () => {
    const canvas = { width: 400, height: 600 };
    const { ghostyHeight, scoreBarHeight } = getScaledConstants(canvas);

    const { Game, state } = makeGame({ canvas });
    state.phase = 'playing';
    // Push ghosty to the floor
    state.ghosty.y = canvas.height - scoreBarHeight + 1;

    Game.update(16);
    expect(state.phase).toBe('game_over');
  });
});
