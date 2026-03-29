// Property-based tests for Renderer
import { describe, it, expect, vi } from 'vitest';
import fc from 'fast-check';

function makeMockCtx() {
  return {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    font: '',
    textAlign: '',
    textBaseline: '',
    globalAlpha: 1,
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    fillText: vi.fn(),
    strokeText: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    roundRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    drawImage: vi.fn(),
    measureText: vi.fn(() => ({ width: 100 })),
  };
}

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

// Inline Renderer for testing
function makeRenderer() {
  return {
    ctx: null,
    ghostyImg: { complete: false, naturalWidth: 0 },
    ghostyImgFailed: false,

    drawBackground(canvas) {
      const ctx = this.ctx;
      ctx.fillStyle = '#87CEEB';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#6ab4d8';
      ctx.lineWidth = 1;
      for (let i = 0; i < 20; i++) {
        const x = Math.floor((canvas.width / 20) * i + 10);
        const y = Math.floor(30 + (canvas.height / 20) * (i % 7));
        const len = 20 + (i * 13) % 40;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + len, y + 2);
        ctx.stroke();
      }
    },

    drawGhosty(ghosty) {
      const ctx = this.ctx;
      if (!this.ghostyImgFailed && this.ghostyImg.complete && this.ghostyImg.naturalWidth > 0) {
        ctx.drawImage(
          this.ghostyImg,
          ghosty.x - ghosty.width / 2,
          ghosty.y - ghosty.height / 2,
          ghosty.width,
          ghosty.height
        );
      } else {
        const r = ghosty.width / 2;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(ghosty.x, ghosty.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#222222';
        ctx.beginPath();
        ctx.arc(ghosty.x - r * 0.3, ghosty.y - r * 0.1, r * 0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(ghosty.x + r * 0.3, ghosty.y - r * 0.1, r * 0.15, 0, Math.PI * 2);
        ctx.fill();
      }
    },

    drawPipes(pipes, canvas, scoreBarHeight) {
      const ctx = this.ctx;
      for (const pipe of pipes) {
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(pipe.x, 0, pipe.width, pipe.gapTop);
        ctx.strokeStyle = '#388E3C';
        ctx.lineWidth = 2;
        ctx.strokeRect(pipe.x, 0, pipe.width, pipe.gapTop);
        const bottomY = pipe.gapBottom;
        const bottomH = canvas.height - scoreBarHeight - bottomY;
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(pipe.x, bottomY, pipe.width, bottomH);
        ctx.strokeStyle = '#388E3C';
        ctx.lineWidth = 2;
        ctx.strokeRect(pipe.x, bottomY, pipe.width, bottomH);
      }
    },

    drawClouds(clouds) {
      const ctx = this.ctx;
      for (const cloud of clouds) {
        const r = cloud.height / 2;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(cloud.x, cloud.y, cloud.width, cloud.height, r);
        } else {
          ctx.moveTo(cloud.x + r, cloud.y);
          ctx.lineTo(cloud.x + cloud.width - r, cloud.y);
          ctx.arc(cloud.x + cloud.width - r, cloud.y + r, r, -Math.PI / 2, 0);
          ctx.lineTo(cloud.x + cloud.width, cloud.y + cloud.height - r);
          ctx.arc(cloud.x + cloud.width - r, cloud.y + cloud.height - r, r, 0, Math.PI / 2);
          ctx.lineTo(cloud.x + r, cloud.y + cloud.height);
          ctx.arc(cloud.x + r, cloud.y + cloud.height - r, r, Math.PI / 2, Math.PI);
          ctx.lineTo(cloud.x, cloud.y + r);
          ctx.arc(cloud.x + r, cloud.y + r, r, Math.PI, -Math.PI / 2);
          ctx.closePath();
        }
        ctx.fill();
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    },

    drawScoreBar(canvas, score, highScore) {
      const ctx = this.ctx;
      const scoreBarHeight = getScaledConstants(canvas).scoreBarHeight;
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, canvas.height - scoreBarHeight, canvas.width, scoreBarHeight);
      ctx.fillStyle = '#ffffff';
      ctx.font = '20px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        `Score: ${score} | High: ${highScore}`,
        canvas.width / 2,
        canvas.height - scoreBarHeight / 2
      );
    },

    drawIdleScreen(canvas) {
      const ctx = this.ctx;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 48px monospace';
      ctx.fillText('Flappy Kiro', canvas.width / 2, canvas.height / 2 - 40);
      ctx.font = '24px monospace';
      ctx.fillText('Tap / Click / Space to Start', canvas.width / 2, canvas.height / 2 + 20);
    },

    drawGameOverScreen(canvas, score) {
      const ctx = this.ctx;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 56px monospace';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 60);
      ctx.font = '28px monospace';
      ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 10);
      ctx.font = '22px monospace';
      ctx.fillText('Tap to Restart', canvas.width / 2, canvas.height / 2 + 60);
    },

    drawNicknameScreen(canvas, inputEl, errorMessage) {
      const ctx = this.ctx;
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 48px monospace';
      ctx.fillText('Flappy Kiro', cx, cy - 100);

      ctx.font = '24px monospace';
      ctx.fillText('Enter your nickname', cx, cy - 44);

      const inputValue = inputEl ? inputEl.value : '';
      const boxW = Math.min(360, canvas.width * 0.7);
      const boxH = 48;
      const boxX = cx - boxW / 2;
      const boxY = cy - boxH / 2;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(boxX, boxY, boxW, boxH);
      ctx.fillStyle = '#1a1a2e';
      ctx.font = '28px monospace';
      ctx.fillText(inputValue || '', cx, cy);

      if (errorMessage) {
        ctx.fillStyle = '#ff4444';
        ctx.font = '18px monospace';
        ctx.fillText(errorMessage, cx, cy + 44);
      }

      ctx.fillStyle = '#aaaaaa';
      ctx.font = '18px monospace';
      ctx.fillText('Press Enter or tap to confirm', cx, cy + (errorMessage ? 80 : 52));
    },

    drawLeaderboardScreen(canvas, entries, currentScore, currentNickname, isLoading, loadError) {
      const ctx = this.ctx;
      const cx = canvas.width / 2;

      ctx.fillStyle = 'rgba(0,0,0,0.80)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px monospace';
      ctx.fillText('Leaderboard', cx, 60);

      if (isLoading) {
        ctx.font = '24px monospace';
        ctx.fillText('Loading...', cx, canvas.height / 2);
      } else if (loadError) {
        ctx.font = '24px monospace';
        ctx.fillText('Could not load leaderboard', cx, canvas.height / 2);
      } else {
        const rowHeight = 32;
        const startY = 110;
        const list = (entries || []).slice(0, 10);
        for (let i = 0; i < list.length; i++) {
          const entry = list[i];
          const rank = i + 1;
          const y = startY + i * rowHeight;
          if (entry.nickname === currentNickname) {
            ctx.fillStyle = '#FFD700';
          } else {
            ctx.fillStyle = '#ffffff';
          }
          ctx.font = '18px monospace';
          ctx.fillText(`#${rank}  ${entry.nickname}  ${entry.score}`, cx, y);
        }
      }

      const scoreY = canvas.height - 100;
      ctx.fillStyle = '#ffffff';
      ctx.font = '20px monospace';
      ctx.fillText(`Your score: ${currentScore}`, cx, scoreY);

      ctx.font = '20px monospace';
      ctx.fillText('Play Again', cx, canvas.height - 56);
    },

    render(gameState) {
      const { canvas, ghosty, pipes, clouds, score, highScore, phase, scoreBarHeight } = gameState;
      this.drawBackground(canvas);
      this.drawPipes(pipes, canvas, scoreBarHeight);
      this.drawClouds(clouds);
      this.drawGhosty(ghosty);
      this.drawScoreBar(canvas, score, highScore);
      if (phase === 'idle') this.drawIdleScreen(canvas);
      if (phase === 'nickname') this.drawNicknameScreen(canvas, gameState.nicknameInput, gameState.nicknameError);
      if (phase === 'leaderboard') this.drawLeaderboardScreen(canvas, gameState.leaderboardEntries, gameState.score, gameState.nickname, gameState.leaderboardLoading, gameState.leaderboardError);
    },
  };
}

const mockCanvas = { width: 400, height: 600 };

describe('Renderer properties', () => {
  it('Property 12: Score display format is correct for all values', () => {
    // Feature: flappy-kiro, Property 12: Score display format is correct for all values
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 99999 }),
        fc.integer({ min: 0, max: 99999 }),
        (score, highScore) => {
          const renderer = makeRenderer();
          const ctx = makeMockCtx();
          renderer.ctx = ctx;

          renderer.drawScoreBar(mockCanvas, score, highScore);

          const calls = ctx.fillText.mock.calls.map(c => c[0]);
          return calls.some(
            t => t.includes(`Score: ${score}`) && t.includes(`High: ${highScore}`)
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 16: Game over screen contains the final score', () => {
    // Feature: flappy-kiro, Property 16: Game over screen contains the final score
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 99999 }),
        (score) => {
          const renderer = makeRenderer();
          const ctx = makeMockCtx();
          renderer.ctx = ctx;

          renderer.drawGameOverScreen(mockCanvas, score);

          const calls = ctx.fillText.mock.calls.map(c => c[0]);
          return calls.some(t => t.includes(String(score)));
        }
      ),
      { numRuns: 100 }
    );
  });
});
