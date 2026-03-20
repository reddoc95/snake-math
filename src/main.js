import {
  BOARD_SIZE,
  BOARD_WIDTH,
  BOARD_HEIGHT,
  CELL_SIZE,
  GRID_SIZE,
  GRID_COLS,
  GRID_ROWS,
  ITEM_TYPES,
  MIN_LENGTH,
  SCORE,
  START_LENGTH,
  START_LIVES,
  STAGE_SPEEDS,
  TARGET_LENGTH,
  THEMES,
  MAX_STAGE,
} from './config.js';
import { generateChoices } from './choice-generator.js';
import { generateProblem } from './problem-generator.js';
import { AudioSystem } from './audio-system.js';
import { ItemSystem } from './item-system.js';
import { clamp, keyOf, positionsEqual, randInt } from './utils.js';

const el = {
  app: document.getElementById('app'),
  screens: {
    start: document.getElementById('screen-start'),
    game: document.getElementById('screen-game'),
    stageClear: document.getElementById('screen-stage-clear'),
    gameOver: document.getElementById('screen-game-over'),
  },
  startBtn: document.getElementById('start-btn'),
  voiceToggleBtn: document.getElementById('voice-toggle-btn'),
  bestScoreLabel: document.getElementById('best-score-label'),
  stageLabel: document.getElementById('stage-label'),
  stageHeroLabel: document.getElementById('stage-hero-label'),
  themeChip: document.getElementById('theme-chip'),
  boardThemeName: document.getElementById('board-theme-name'),
  scoreLabel: document.getElementById('score-label'),
  lengthLabel: document.getElementById('length-label'),
  livesLabel: document.getElementById('lives-label'),
  comboLabel: document.getElementById('combo-label'),
  progressBar: document.getElementById('progress-bar'),
  progressText: document.getElementById('progress-text'),
  problemLabel: document.getElementById('problem-label'),
  speakBtn: document.getElementById('speak-btn'),
  pauseBtn: document.getElementById('pause-btn'),
  muteBtn: document.getElementById('mute-btn'),
  restartBtn: document.getElementById('restart-btn'),
  nextStageBtn: document.getElementById('next-stage-btn'),
  retryBtn: document.getElementById('retry-btn'),
  stageClearText: document.getElementById('stage-clear-text'),
  gameOverTitle: document.getElementById('game-over-title'),
  gameOverText: document.getElementById('game-over-text'),
  stageClearScore: document.getElementById('stage-clear-score'),
  stageClearTheme: document.getElementById('stage-clear-theme'),
  finalScoreLabel: document.getElementById('final-score-label'),
  resultBestScoreLabel: document.getElementById('result-best-score-label'),
  statusBanner: document.getElementById('status-banner'),
  canvas: document.getElementById('game-canvas'),
};

const ctx = el.canvas.getContext('2d');
el.canvas.width = BOARD_WIDTH;
el.canvas.height = BOARD_HEIGHT;

const audio = new AudioSystem();
const items = new ItemSystem();

const BEST_SCORE_KEY = 'snake-math-best-score';

const state = {
  stage: 1,
  score: 0,
  bestScore: 0,
  lives: START_LIVES,
  snake: [],
  previousSnake: [],
  direction: { x: 1, y: 0 },
  pendingDirection: { x: 1, y: 0 },
  lastStepAt: 0,
  currentStepDuration: STAGE_SPEEDS[1],
  paused: false,
  muted: false,
  screen: 'start',
  problem: null,
  choices: [],
  choicePositions: [],
  effects: { speedBoostUntil: 0, speedSlowUntil: 0, hintUntil: 0 },
  combo: 0,
  touchStart: null,
  bannerText: '',
  bannerUntil: 0,
  particles: [],
  flashUntil: 0,
  flashColor: '#ffffff',
  celebration: null,
  correctStampUntil: 0,
  shakeUntil: 0,
  shakeStrength: 0,
};

function init() {
  state.bestScore = loadBestScore();
  bindEvents();
  resetStage(1, true);
  showScreen('start');
  updateHud();
  requestAnimationFrame(loop);
}

function bindEvents() {
  el.startBtn.addEventListener('click', () => {
    audio.play('start');
    resetStage(1, true);
    showScreen('game');
    speakProblem();
  });

  el.voiceToggleBtn.addEventListener('click', () => {
    state.muted = !state.muted;
    audio.setEnabled(!state.muted);
    el.voiceToggleBtn.textContent = `음성: ${state.muted ? '꺼짐' : '켜짐'}`;
    el.muteBtn.textContent = state.muted ? '음소거 해제' : '음소거';
  });

  if (el.speakBtn) el.speakBtn.addEventListener('click', speakProblem);
  el.pauseBtn.addEventListener('click', () => {
    state.paused = !state.paused;
    el.pauseBtn.textContent = state.paused ? '계속하기' : '일시정지';
    setBanner(state.paused ? '잠시 숨 고르기' : `${state.stage}단계 다시 출발!`, 900);
  });
  el.muteBtn.addEventListener('click', () => {
    state.muted = !state.muted;
    audio.setEnabled(!state.muted);
    el.muteBtn.textContent = state.muted ? '음소거 해제' : '음소거';
    el.voiceToggleBtn.textContent = `음성: ${state.muted ? '꺼짐' : '켜짐'}`;
  });
  el.restartBtn.addEventListener('click', () => {
    resetStage(state.stage, false);
    showScreen('game');
  });
  el.nextStageBtn.addEventListener('click', () => {
    resetStage(clamp(state.stage + 1, 1, MAX_STAGE), false);
    showScreen('game');
    speakProblem();
  });
  el.retryBtn.addEventListener('click', () => {
    resetStage(state.stage, false);
    showScreen('game');
    speakProblem();
  });

  window.addEventListener('keydown', handleKey);
  document.addEventListener('visibilitychange', handleVisibilityChange);

  el.canvas.addEventListener('touchstart', (event) => {
    const touch = event.changedTouches[0];
    state.touchStart = { x: touch.clientX, y: touch.clientY };
  }, { passive: true });

  el.canvas.addEventListener('touchend', (event) => {
    if (!state.touchStart) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - state.touchStart.x;
    const dy = touch.clientY - state.touchStart.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    if (Math.max(absX, absY) < 18) {
      state.touchStart = null;
      return;
    }
    if (absX > absY) setDirection(dx > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 });
    else setDirection(dy > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 });
    state.touchStart = null;
  }, { passive: true });
}

function handleKey(event) {
  const map = {
    ArrowUp: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 },
  };
  if (map[event.key]) {
    event.preventDefault();
    setDirection(map[event.key]);
  }
}

function handleVisibilityChange() {
  if (!document.hidden) return;
  if (state.screen === 'game' && !state.paused) {
    state.paused = true;
    el.pauseBtn.textContent = '계속하기';
    setBanner('화면이 숨겨져 자동 일시정지됨', 1400);
  }
  audio.stopSpeech();
}

function setDirection(next) {
  if (state.screen !== 'game') return;
  const current = state.direction;
  if (current.x + next.x === 0 && current.y + next.y === 0) return;
  state.pendingDirection = next;
}

function showScreen(name) {
  state.screen = name;
  Object.entries(el.screens).forEach(([key, node]) => node.classList.toggle('active', key === name));
}

function loadBestScore() {
  try {
    return Number(localStorage.getItem(BEST_SCORE_KEY) || 0);
  } catch {
    return 0;
  }
}

function saveBestScore() {
  state.bestScore = Math.max(state.bestScore, state.score);
  try {
    localStorage.setItem(BEST_SCORE_KEY, String(state.bestScore));
  } catch {}
}

function setBanner(text, duration = 1800) {
  state.bannerText = text;
  state.bannerUntil = performance.now() + duration;
  el.statusBanner.textContent = text;
}

function triggerCelebration(type, text, strength = 1) {
  state.celebration = {
    type,
    text,
    strength,
    startAt: performance.now(),
    endAt: performance.now() + 900 + strength * 120,
  };
}

function triggerShake(strength = 6, duration = 220) {
  state.shakeStrength = strength;
  state.shakeUntil = performance.now() + duration;
}

function getComboCallout(combo) {
  if (combo >= 10) return 'UNSTOPPABLE';
  if (combo >= 8) return 'LEGENDARY';
  if (combo >= 6) return 'AMAZING';
  if (combo >= 4) return 'GREAT';
  if (combo >= 2) return 'NICE';
  return 'GOOD';
}

function resetStage(stage, resetScore) {
  state.stage = stage;
  if (resetScore) state.score = 0;
  saveBestScore();
  state.lives = START_LIVES;
  state.combo = 0;
  state.effects = { speedBoostUntil: 0, speedSlowUntil: 0, hintUntil: 0 };
  resetSnake();
  items.reset();
  createProblemSet();
  updateTheme();
  updateHud();
  setBanner(`${stage}단계 ${THEMES[stage].name} 시작!`);
}

function resetSnake() {
  state.snake = [
    { x: 4, y: 7 },
    { x: 3, y: 7 },
    { x: 2, y: 7 },
  ];
  state.previousSnake = state.snake.map((segment) => ({ ...segment }));
  state.direction = { x: 1, y: 0 };
  state.pendingDirection = { x: 1, y: 0 };
  state.lastStepAt = 0;
  state.currentStepDuration = getCurrentSpeed();
}

function createProblemSet() {
  const prev = state.problem?.display || '';
  state.problem = generateProblem(state.stage, prev);
  state.choices = generateChoices(state.problem.answer, state.stage);
  state.choicePositions = placeChoices();
  updateHud();
}

function placeChoices() {
  const occupied = new Set(state.snake.map(keyOf));
  const positions = [];
  for (const value of state.choices) {
    const pos = randomEmptyCell(occupied);
    if (!pos) break;
    occupied.add(keyOf(pos));
    positions.push({ value, pos });
  }
  return positions;
}

function randomEmptyCell(occupied) {
  for (let i = 0; i < 300; i += 1) {
    const pos = { x: randInt(0, GRID_COLS - 1), y: randInt(0, GRID_ROWS - 1) };
    if (occupied.has(keyOf(pos))) continue;
    if (state.snake.some((segment) => Math.abs(segment.x - pos.x) + Math.abs(segment.y - pos.y) <= 1)) continue;
    return pos;
  }

  for (let y = 0; y < GRID_ROWS; y += 1) {
    for (let x = 0; x < GRID_COLS; x += 1) {
      const pos = { x, y };
      if (occupied.has(keyOf(pos))) continue;
      if (state.snake.some((segment) => Math.abs(segment.x - pos.x) + Math.abs(segment.y - pos.y) <= 1)) continue;
      return pos;
    }
  }

  for (let y = 0; y < GRID_ROWS; y += 1) {
    for (let x = 0; x < GRID_COLS; x += 1) {
      const pos = { x, y };
      if (!occupied.has(keyOf(pos))) return pos;
    }
  }

  return null;
}

function updateHud() {
  const theme = THEMES[state.stage];
  const progress = Math.min(100, (state.snake.length / TARGET_LENGTH) * 100);
  el.bestScoreLabel.textContent = state.bestScore;
  if (el.stageLabel) el.stageLabel.textContent = `${state.stage} (${theme.name})`;
  if (el.stageHeroLabel) el.stageHeroLabel.textContent = `STAGE ${state.stage} · ${theme.name}`;
  if (el.themeChip) el.themeChip.textContent = getThemeChipLabel(theme);
  if (el.boardThemeName) el.boardThemeName.textContent = theme.name;
  el.scoreLabel.textContent = state.score;
  if (el.lengthLabel) el.lengthLabel.textContent = state.snake.length;
  el.livesLabel.textContent = '❤️'.repeat(state.lives);
  el.comboLabel.textContent = state.combo;
  el.problemLabel.textContent = state.problem?.display || '';
  if (el.progressBar) el.progressBar.style.width = `${progress}%`;
  if (el.progressText) el.progressText.textContent = `${state.snake.length} / ${TARGET_LENGTH}`;
  el.stageClearScore.textContent = state.score;
  el.finalScoreLabel.textContent = state.score;
  el.resultBestScoreLabel.textContent = state.bestScore;
  el.app.style.setProperty('--theme-accent', theme.accent || '#8fe388');
  if (performance.now() > state.bannerUntil) {
    el.statusBanner.textContent = '';
  }
}

function getThemeChipLabel(theme) {
  const now = performance.now();
  if (state.effects.hintUntil > now) return 'HINT MODE';
  if (state.effects.speedBoostUntil > now) return 'BOOST MODE';
  if (state.effects.speedSlowUntil > now) return 'SLOW MODE';
  if (state.combo >= 5) return 'HOT STREAK';
  return theme.englishName;
}

function speakProblem() {
  audio.speak(state.problem?.speech);
}

function loop(now) {
  if (state.screen === 'game' && !state.paused) {
    const speed = getCurrentSpeed();
    state.currentStepDuration = speed;
    if (!state.lastStepAt || now - state.lastStepAt >= speed) {
      step(now);
      state.lastStepAt = now;
    }
    items.update(now, new Set([...state.snake.map(keyOf), ...state.choicePositions.map((c) => keyOf(c.pos))]), randomEmptyCell);
  }
  render(now);
  requestAnimationFrame(loop);
}

function getCurrentSpeed() {
  let speed = STAGE_SPEEDS[state.stage] || STAGE_SPEEDS[MAX_STAGE];
  const now = performance.now();
  if (state.effects.speedBoostUntil > now) speed -= 80;
  if (state.effects.speedSlowUntil > now) speed += 100;
  return Math.max(110, speed);
}

function step(now) {
  state.previousSnake = state.snake.map((segment) => ({ ...segment }));
  state.direction = state.pendingDirection;
  const head = state.snake[0];
  const next = {
    x: (head.x + state.direction.x + GRID_COLS) % GRID_COLS,
    y: (head.y + state.direction.y + GRID_ROWS) % GRID_ROWS,
  };

  const choice = state.choicePositions.find((entry) => positionsEqual(entry.pos, next));
  const item = items.items.find((entry) => positionsEqual(entry.pos, next));
  const tailWillMove = !choice && !item;
  const collisionBody = tailWillMove ? state.snake.slice(0, -1) : state.snake;

  if (collisionBody.some((segment) => positionsEqual(segment, next))) {
    loseLife('몸에 부딪혔어요!');
    return;
  }

  state.snake.unshift(next);

  const consumedItem = item ? items.consumeAt(next) : null;

  if (consumedItem) applyItem(consumedItem, now);

  if (choice) {
    if (choice.value === state.problem.answer) handleCorrect();
    else handleWrong();
  } else {
    state.snake.pop();
  }

  if (state.snake.length >= TARGET_LENGTH) {
    handleStageClear();
  }

  updateHud();
}

function handleCorrect() {
  state.combo += 1;
  const gained = SCORE.correct + Math.max(0, (state.combo - 1) * 2);
  state.score += gained;
  state.flashUntil = performance.now() + 150;
  state.flashColor = '#ffd43b';
  audio.play('correct');
  triggerShake(Math.min(12, 3 + state.combo), 180 + state.combo * 12);
  saveBestScore();
  spawnParticles(state.snake[0], '#ffd43b', state.combo > 1 ? 14 : 8);
  if (state.combo >= 3) spawnParticles(state.snake[0], THEMES[state.stage].accent, 12 + state.combo);
  state.correctStampUntil = performance.now() + 520;
  const exclamations = '!'.repeat(Math.min(6, state.combo + 1));
  triggerCelebration('combo', `${state.combo} COMBO${exclamations}`, Math.min(6, state.combo));
  setBanner(`${getComboCallout(state.combo)} · +${gained}`);
  createProblemSet();
  speakProblem();
}

function handleWrong() {
  state.combo = 0;
  state.score += SCORE.wrong;
  state.flashUntil = performance.now() + 180;
  state.flashColor = '#4dabf7';
  audio.play('wrong');
  spawnParticles(state.snake[0], '#4dabf7', 10);
  if (state.snake.length > MIN_LENGTH) {
    state.snake.pop();
    setBanner('오답! 길이가 줄었어.');
  } else {
    loseLife('오답! 생명이 줄었어요.');
    return;
  }
  createProblemSet();
  speakProblem();
}

function loseLife(message) {
  state.lives -= 1;
  state.flashUntil = performance.now() + 240;
  state.flashColor = '#ff6b6b';
  triggerShake(14, 260);
  audio.play(state.lives <= 0 ? 'gameOver' : 'lifeLost');
  spawnParticles(state.snake[0], '#ff6b6b', 18);
  spawnParticles(state.snake[0], '#ffffff', 10);
  saveBestScore();
  if (state.lives <= 0) {
    el.gameOverTitle.textContent = '게임 오버';
    el.gameOverText.textContent = `${message} 점수 ${state.score}. 최고 점수 ${state.bestScore}. 현재 단계 ${state.stage}부터 다시 시작합니다.`;
    el.finalScoreLabel.textContent = state.score;
    el.resultBestScoreLabel.textContent = state.bestScore;
    showScreen('gameOver');
    return;
  }
  state.combo = 0;
  setBanner(`${message} 남은 생명 ${state.lives}`);
  state.snake = state.snake.slice(0, START_LENGTH);
  resetSnake();
  createProblemSet();
  speakProblem();
}

function handleStageClear() {
  state.score += SCORE.stageClear + state.lives * SCORE.lifeBonus;
  audio.play('stageClear');
  spawnParticles(state.snake[0], '#51cf66', 28);
  saveBestScore();
  el.stageClearScore.textContent = state.score;
  if (state.stage >= MAX_STAGE) {
    el.gameOverTitle.textContent = '올 클리어! 👑';
    el.gameOverText.textContent = `모든 단계를 클리어했어! 최종 점수 ${state.score}. 최고 점수 ${state.bestScore}. ${MAX_STAGE}단계부터 다시 도전할 수 있어.`;
    el.finalScoreLabel.textContent = state.score;
    el.resultBestScoreLabel.textContent = state.bestScore;
    showScreen('gameOver');
    return;
  }
  el.stageClearTheme.textContent = `${state.stage + 1}단계 · ${THEMES[state.stage + 1].name}`;
  el.stageClearText.textContent = `${state.stage}단계 클리어! 보너스 포함 점수 ${state.score}. 다음은 ${state.stage + 1}단계 ${THEMES[state.stage + 1].name} 테마야.`;
  showScreen('stageClear');
}

function applyItem(item, now) {
  audio.play('item');
  spawnParticles(item.pos, item.meta.color, 12);
  switch (item.type) {
    case ITEM_TYPES.GROW:
      state.snake.push({ ...state.snake[state.snake.length - 1] }, { ...state.snake[state.snake.length - 1] });
      setBanner('🍎 성장 아이템! 길이 +2');
      break;
    case ITEM_TYPES.SHRINK:
      state.snake = state.snake.slice(0, Math.max(MIN_LENGTH, state.snake.length - 3));
      setBanner('💣 축소 아이템! 길이 -3');
      break;
    case ITEM_TYPES.FAST:
      state.effects.speedBoostUntil = now + 5000;
      setBanner('⚡ 5초 동안 빨라져!');
      break;
    case ITEM_TYPES.SLOW:
      state.effects.speedSlowUntil = now + 5000;
      setBanner('🧊 5초 동안 느려져!');
      break;
    case ITEM_TYPES.RESET:
      state.snake = state.snake.slice(0, START_LENGTH);
      setBanner('🌀 길이 초기화!');
      break;
    case ITEM_TYPES.HINT:
      state.effects.hintUntil = now + 5000;
      setBanner('⭐ 정답 힌트 활성화!');
      break;
    default:
      break;
  }
}

function updateTheme() {
  const theme = THEMES[state.stage];
  Object.values(THEMES).forEach((entry) => el.app.classList.remove(entry.className));
  el.app.classList.add(theme.className);
}

function render(now) {
  if (now > state.bannerUntil && el.statusBanner.textContent) {
    el.statusBanner.textContent = '';
  }
  const moveProgress = getMoveProgress(now);
  const shaking = now <= state.shakeUntil;
  ctx.clearRect(0, 0, BOARD_SIZE, BOARD_SIZE);
  applyScreenShake(now);
  drawBoardBackdrop(now);
  drawGrid();
  drawChoices(now);
  drawItems(now);
  drawSnake(now, moveProgress);
  updateAndDrawParticles();
  drawBoardFlash(now);
  drawCorrectStamp(now);
  drawCelebration(now);
  if (state.paused && state.screen === 'game') drawOverlay('일시정지');
  if (shaking) ctx.restore();
}

function getMoveProgress(now) {
  if (!state.lastStepAt || state.paused || state.screen !== 'game') return 1;
  return clamp((now - state.lastStepAt) / Math.max(1, state.currentStepDuration), 0, 1);
}

function drawBoardBackdrop(now) {
  const theme = THEMES[state.stage];
  ctx.save();
  const bg = ctx.createLinearGradient(0, 0, BOARD_SIZE, BOARD_SIZE);
  bg.addColorStop(0, theme.backdropA);
  bg.addColorStop(1, theme.backdropB);
  ctx.fillStyle = bg;
  roundRect(ctx, 0, 0, BOARD_SIZE, BOARD_SIZE, 26);
  ctx.fill();

  const glow = ctx.createRadialGradient(BOARD_WIDTH * 0.82, BOARD_HEIGHT * 0.18, 10, BOARD_WIDTH * 0.82, BOARD_HEIGHT * 0.18, BOARD_HEIGHT * 0.46);
  glow.addColorStop(0, theme.boardGlow);
  glow.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = glow;
  roundRect(ctx, 0, 0, BOARD_SIZE, BOARD_SIZE, 26);
  ctx.fill();

  for (let i = 0; i < 18; i += 1) {
    const size = 18 + ((i * 17) % 26);
    const x = (i * 63 + now * 0.01 * (i % 2 === 0 ? 1 : -1)) % BOARD_SIZE;
    const y = (i * 91 + now * 0.008 * (i % 3 === 0 ? 1 : -1)) % BOARD_SIZE;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.018)';
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  drawStageDeco(theme, now);
  ctx.restore();
}

function drawStageDeco(theme, now) {
  ctx.save();
  ctx.globalAlpha = 0.2;
  ctx.strokeStyle = theme.accent;
  ctx.fillStyle = theme.accent;
  for (let i = 0; i < 7; i += 1) {
    const baseX = ((i * 71) + now * 0.012 * (i % 2 === 0 ? 1 : -1) + BOARD_SIZE) % BOARD_SIZE;
    const baseY = ((i * 53) + now * 0.009 * (i % 3 === 0 ? -1 : 1) + BOARD_SIZE) % BOARD_SIZE;
    switch (theme.deco) {
      case 'leaf':
        ctx.beginPath();
        ctx.ellipse(baseX, baseY, 9, 4, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'bubble':
        ctx.beginPath();
        ctx.arc(baseX, baseY, 6 + (i % 3), 0, Math.PI * 2);
        ctx.stroke();
        break;
      case 'star':
        drawMiniStar(baseX, baseY, 7);
        break;
      case 'candy':
        ctx.beginPath();
        ctx.roundRect?.(baseX - 7, baseY - 5, 14, 10, 5);
        if (ctx.roundRect) ctx.fill();
        else {
          roundRect(ctx, baseX - 7, baseY - 5, 14, 10, 5);
          ctx.fill();
        }
        break;
      case 'gem':
        ctx.beginPath();
        ctx.moveTo(baseX, baseY - 7);
        ctx.lineTo(baseX + 7, baseY);
        ctx.lineTo(baseX, baseY + 7);
        ctx.lineTo(baseX - 7, baseY);
        ctx.closePath();
        ctx.fill();
        break;
      default:
        break;
    }
  }
  ctx.restore();
}

function drawMiniStar(x, y, r) {
  ctx.beginPath();
  for (let i = 0; i < 5; i += 1) {
    const outer = ((Math.PI * 2) / 5) * i - Math.PI / 2;
    const inner = outer + Math.PI / 5;
    if (i === 0) ctx.moveTo(x + Math.cos(outer) * r, y + Math.sin(outer) * r);
    else ctx.lineTo(x + Math.cos(outer) * r, y + Math.sin(outer) * r);
    ctx.lineTo(x + Math.cos(inner) * (r * 0.45), y + Math.sin(inner) * (r * 0.45));
  }
  ctx.closePath();
  ctx.fill();
}

function drawBoardFlash(now) {
  if (now > state.flashUntil) return;
  const alpha = (state.flashUntil - now) / 240;
  ctx.save();
  ctx.globalAlpha = Math.max(0, alpha) * 0.24;
  ctx.fillStyle = state.flashColor;
  roundRect(ctx, 0, 0, BOARD_SIZE, BOARD_SIZE, 26);
  ctx.fill();
  ctx.restore();
}

function drawGrid() {
  const theme = THEMES[state.stage];
  ctx.save();
  ctx.strokeStyle = theme.gridColor;
  ctx.lineWidth = 1;
  for (let i = 0; i <= GRID_COLS; i += 1) {
    const p = i * CELL_SIZE;
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, BOARD_HEIGHT);
    ctx.stroke();
  }
  for (let i = 0; i <= GRID_ROWS; i += 1) {
    const p = i * CELL_SIZE;
    ctx.beginPath();
    ctx.moveTo(0, p);
    ctx.lineTo(BOARD_WIDTH, p);
    ctx.stroke();
  }
  ctx.restore();
}

function drawChoices(now) {
  const hintActive = state.effects.hintUntil > now;
  const theme = THEMES[state.stage];
  for (const choice of state.choicePositions) {
    const isCorrect = choice.value === state.problem.answer;
    const x = choice.pos.x * CELL_SIZE;
    const y = choice.pos.y * CELL_SIZE;
    const bubble = ctx.createRadialGradient(x + 10, y + 10, 3, x + CELL_SIZE / 2, y + CELL_SIZE / 2, CELL_SIZE / 1.2);
    bubble.addColorStop(0, hintActive && isCorrect ? '#fff6a0' : theme.tileA);
    bubble.addColorStop(1, hintActive && isCorrect ? '#ffd7b8' : theme.tileB);

    ctx.save();
    ctx.shadowColor = hintActive && isCorrect ? 'rgba(255, 214, 102, 0.9)' : `${theme.accent}33`;
    ctx.shadowBlur = hintActive && isCorrect ? 18 : 10;
    ctx.fillStyle = bubble;
    ctx.strokeStyle = hintActive && isCorrect ? '#ff922b' : `${theme.accent}`;
    ctx.lineWidth = hintActive && isCorrect ? 3.5 : 1.8;
    roundRect(ctx, x + 3, y + 3, CELL_SIZE - 6, CELL_SIZE - 6, 11);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    roundRect(ctx, x + 7, y + 6, CELL_SIZE - 14, 7, 4);
    ctx.fill();
    ctx.strokeStyle = `${theme.accent}66`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x + 10, y + CELL_SIZE - 10);
    ctx.lineTo(x + CELL_SIZE - 10, y + 10);
    ctx.stroke();
    ctx.fillStyle = '#182033';
    ctx.font = '900 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(choice.value), x + CELL_SIZE / 2, y + CELL_SIZE / 2 + 1);
    ctx.restore();
  }
}

function drawItems(now) {
  const pulse = (Math.sin(now / 200) + 1) / 2;
  for (const item of items.items) {
    const x = item.pos.x * CELL_SIZE;
    const y = item.pos.y * CELL_SIZE;
    const cx = x + CELL_SIZE / 2;
    const cy = y + CELL_SIZE / 2;

    ctx.save();
    ctx.shadowColor = `${item.meta.color}aa`;
    ctx.shadowBlur = 18;
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    ctx.beginPath();
    ctx.arc(cx, cy, 13 + pulse * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    drawItemIcon(item.type, cx, cy, pulse);
    ctx.restore();
  }
}

function drawSnake(now, moveProgress) {
  const theme = THEMES[state.stage];
  const headDirection = getVisualHeadDirection(moveProgress);
  state.snake.forEach((segment, index) => {
    const from = state.previousSnake[index] || state.previousSnake[state.previousSnake.length - 1] || segment;
    const visual = interpolateSegment(from, segment, moveProgress);
    const x = visual.x * CELL_SIZE;
    const y = visual.y * CELL_SIZE;
    const pulse = 0.92 + ((Math.sin((now / 90) + index * 0.45) + 1) / 2) * 0.08;
    ctx.save();
    if (index === 0) {
      const headGradient = ctx.createLinearGradient(x, y, x + CELL_SIZE, y + CELL_SIZE);
      headGradient.addColorStop(0, theme.snakeHeadA);
      headGradient.addColorStop(1, theme.snakeHeadB);
      ctx.fillStyle = headGradient;
      ctx.shadowColor = `${theme.accent}77`;
      ctx.shadowBlur = 14;
      roundRect(ctx, x + 1.5, y + 1.5, CELL_SIZE - 3, CELL_SIZE - 3, 12);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,255,255,0.24)';
      roundRect(ctx, x + 5, y + 5, CELL_SIZE - 10, 8, 4);
      ctx.fill();
      drawSnakeFace(x, y, headDirection, now);
    } else {
      const bodyGradient = ctx.createLinearGradient(x, y, x + CELL_SIZE, y + CELL_SIZE);
      bodyGradient.addColorStop(0, theme.snakeBodyA);
      bodyGradient.addColorStop(1, theme.snakeBodyB);
      ctx.fillStyle = bodyGradient;
      roundRect(
        ctx,
        x + (CELL_SIZE * (1 - pulse)) / 2 + 3,
        y + (CELL_SIZE * (1 - pulse)) / 2 + 3,
        CELL_SIZE * pulse - 6,
        CELL_SIZE * pulse - 6,
        10,
      );
      ctx.fill();
      drawBodyStripe(x, y, pulse, theme.accent);
    }
    ctx.restore();
  });
}

function getVisualHeadDirection(progress) {
  if (progress < 0.42) return state.direction;
  return state.pendingDirection;
}

function interpolateSegment(from, to, progress) {
  return {
    x: lerpWrapped(from.x, to.x, progress, GRID_COLS),
    y: lerpWrapped(from.y, to.y, progress, GRID_ROWS),
  };
}

function lerpWrapped(from, to, progress, size) {
  let delta = to - from;
  if (Math.abs(delta) > size / 2) {
    delta += delta > 0 ? -size : size;
  }
  let value = from + delta * progress;
  while (value < 0) value += size;
  while (value >= size) value -= size;
  return value;
}

function drawSnakeFace(x, y, direction, now) {
  const angle = Math.atan2(direction.y, direction.x);
  const tongue = (Math.sin(now / 120) + 1) / 2;
  ctx.save();
  ctx.translate(x + CELL_SIZE / 2, y + CELL_SIZE / 2);
  ctx.rotate(angle + Math.PI / 2);

  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(-5, -4, 4.2, 0, Math.PI * 2);
  ctx.arc(5, -4, 4.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#1f2333';
  ctx.beginPath();
  ctx.arc(-4.5, -3.5, 1.7, 0, Math.PI * 2);
  ctx.arc(5.5, -3.5, 1.7, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#1f2333';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 4, 5.2, 0.2, Math.PI - 0.2);
  ctx.stroke();

  ctx.strokeStyle = '#ff9ec1';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -11);
  ctx.lineTo(0, -14 - tongue * 4);
  ctx.moveTo(0, -14 - tongue * 4);
  ctx.lineTo(-2.5, -17 - tongue * 4);
  ctx.moveTo(0, -14 - tongue * 4);
  ctx.lineTo(2.5, -17 - tongue * 4);
  ctx.stroke();

  ctx.restore();
}

function drawBodyStripe(x, y, pulse, accent) {
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  roundRect(
    ctx,
    x + 9,
    y + 6 + (1 - pulse) * 2,
    CELL_SIZE - 18,
    CELL_SIZE - 18,
    6,
  );
  ctx.fill();
  ctx.strokeStyle = `${accent}66`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + 8, y + CELL_SIZE / 2);
  ctx.lineTo(x + CELL_SIZE - 8, y + CELL_SIZE / 2);
  ctx.stroke();
  ctx.restore();
}

function drawItemIcon(type, cx, cy, pulse) {
  switch (type) {
    case ITEM_TYPES.GROW:
      drawAppleIcon(cx, cy, pulse);
      break;
    case ITEM_TYPES.SHRINK:
      drawMineIcon(cx, cy, pulse);
      break;
    case ITEM_TYPES.FAST:
      drawBoltIcon(cx, cy, pulse);
      break;
    case ITEM_TYPES.SLOW:
      drawSnowflakeIcon(cx, cy, pulse);
      break;
    case ITEM_TYPES.RESET:
      drawResetIcon(cx, cy, pulse);
      break;
    case ITEM_TYPES.HINT:
      drawHintIcon(cx, cy, pulse);
      break;
    default:
      break;
  }
}

function drawAppleIcon(cx, cy, pulse) {
  ctx.save();
  ctx.fillStyle = '#ff5f57';
  ctx.beginPath();
  ctx.arc(cx - 4, cy + 1, 7 + pulse, 0, Math.PI * 2);
  ctx.arc(cx + 4, cy + 1, 7 + pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#36b24a';
  ctx.beginPath();
  ctx.ellipse(cx + 3, cy - 8, 5, 3, -0.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#5c3d1e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 7);
  ctx.lineTo(cx + 1, cy - 12);
  ctx.stroke();
  ctx.restore();
}

function drawMineIcon(cx, cy, pulse) {
  ctx.save();
  ctx.fillStyle = '#202632';
  ctx.beginPath();
  ctx.arc(cx, cy, 7.5 + pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 2;
  for (let i = 0; i < 8; i += 1) {
    const angle = (Math.PI * 2 * i) / 8;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * 8, cy + Math.sin(angle) * 8);
    ctx.lineTo(cx + Math.cos(angle) * 13, cy + Math.sin(angle) * 13);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBoltIcon(cx, cy, pulse) {
  ctx.save();
  ctx.fillStyle = '#ffd43b';
  ctx.beginPath();
  ctx.moveTo(cx + 2, cy - 12);
  ctx.lineTo(cx - 4, cy - 1);
  ctx.lineTo(cx + 1, cy - 1);
  ctx.lineTo(cx - 2, cy + 12);
  ctx.lineTo(cx + 8, cy - 2);
  ctx.lineTo(cx + 2, cy - 2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#fff3bf';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

function drawSnowflakeIcon(cx, cy, pulse) {
  ctx.save();
  ctx.strokeStyle = '#d8f3ff';
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i += 1) {
    const angle = (Math.PI * i) / 3;
    const dx = Math.cos(angle) * (10 + pulse);
    const dy = Math.sin(angle) * (10 + pulse);
    ctx.beginPath();
    ctx.moveTo(cx - dx, cy - dy);
    ctx.lineTo(cx + dx, cy + dy);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(cx, cy, 3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawResetIcon(cx, cy, pulse) {
  ctx.save();
  ctx.strokeStyle = '#d0bfff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, 9 + pulse, 0.65, Math.PI * 1.9);
  ctx.stroke();
  ctx.fillStyle = '#d0bfff';
  ctx.beginPath();
  ctx.moveTo(cx + 7, cy - 10);
  ctx.lineTo(cx + 13, cy - 11);
  ctx.lineTo(cx + 10, cy - 5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawHintIcon(cx, cy, pulse) {
  ctx.save();
  ctx.strokeStyle = '#ffe066';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.ellipse(cx, cy, 11 + pulse, 7.5 + pulse * 0.4, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#ffe066';
  ctx.beginPath();
  ctx.arc(cx, cy, 3.6 + pulse * 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function applyScreenShake(now) {
  if (now > state.shakeUntil) return;
  const remain = (state.shakeUntil - now) / Math.max(1, state.shakeStrength * 20);
  const strength = Math.max(0, Math.min(1, remain)) * state.shakeStrength;
  const dx = (Math.random() - 0.5) * strength;
  const dy = (Math.random() - 0.5) * strength;
  ctx.save();
  ctx.translate(dx, dy);
}

function drawCorrectStamp(now) {
  if (now > state.correctStampUntil) return;
  const progress = 1 - (state.correctStampUntil - now) / 520;
  const scale = 0.78 + Math.sin(progress * Math.PI) * 0.52;
  const alpha = 1 - progress;
  ctx.save();
  ctx.translate(BOARD_WIDTH / 2, BOARD_HEIGHT / 2 - 10);
  ctx.scale(scale, scale);
  ctx.globalAlpha = Math.max(0, alpha);

  const bg = ctx.createLinearGradient(-120, -40, 120, 40);
  bg.addColorStop(0, '#fff9b8');
  bg.addColorStop(0.5, '#ffffff');
  bg.addColorStop(1, THEMES[state.stage].accent);
  ctx.fillStyle = bg;
  ctx.strokeStyle = 'rgba(12,18,38,0.8)';
  ctx.lineWidth = 10;
  roundRect(ctx, -120, -46, 240, 92, 30);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = 'rgba(255,255,255,0.38)';
  roundRect(ctx, -104, -34, 208, 16, 10);
  ctx.fill();

  ctx.fillStyle = '#16a34a';
  ctx.beginPath();
  ctx.arc(-66, 0, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineCap = 'round';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(-76, 0);
  ctx.lineTo(-67, 10);
  ctx.lineTo(-52, -9);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.font = '900 34px sans-serif';
  ctx.lineWidth = 10;
  ctx.strokeStyle = 'rgba(12,18,38,0.78)';
  ctx.strokeText('CORRECT!', 24, 0);
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = `${THEMES[state.stage].accent}cc`;
  ctx.shadowBlur = 22;
  ctx.fillText('CORRECT!', 24, 0);
  ctx.restore();
}

function drawCelebration(now) {
  if (!state.celebration || now > state.celebration.endAt) {
    state.celebration = null;
    return;
  }
  const { text, strength, startAt, endAt } = state.celebration;
  const total = endAt - startAt;
  const elapsed = now - startAt;
  const t = clamp(elapsed / total, 0, 1);
  const enter = Math.min(1, t / 0.18);
  const exit = t > 0.74 ? 1 - ((t - 0.74) / 0.26) : 1;
  const alpha = Math.max(0, Math.min(enter, exit));
  const pop = 0.82 + Math.sin(Math.min(1, t) * Math.PI) * (0.26 + strength * 0.06);
  const y = BOARD_HEIGHT * 0.23 - (1 - alpha) * 28;
  const accent = THEMES[state.stage].accent;
  const label = getComboCallout(strength);

  ctx.save();
  ctx.translate(BOARD_WIDTH / 2, y);
  ctx.scale(pop, pop);
  ctx.globalAlpha = alpha;

  const width = 260 + strength * 12;
  const height = 118 + strength * 4;
  const bg = ctx.createLinearGradient(-width / 2, -height / 2, width / 2, height / 2);
  bg.addColorStop(0, '#fff4a8');
  bg.addColorStop(0.38, '#ffffff');
  bg.addColorStop(1, accent);
  ctx.fillStyle = bg;
  ctx.strokeStyle = 'rgba(12,18,38,0.82)';
  ctx.lineWidth = 12;
  roundRect(ctx, -width / 2, -height / 2, width, height, 34);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = 'rgba(255,255,255,0.34)';
  roundRect(ctx, -width / 2 + 18, -height / 2 + 14, width - 36, 18, 10);
  ctx.fill();

  drawBurst(accidentSafe(accent), strength);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.font = `900 ${36 + strength * 5}px sans-serif`;
  ctx.lineWidth = 12;
  ctx.strokeStyle = 'rgba(12,18,38,0.8)';
  ctx.strokeText(text, 0, -8);
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = `${accent}cc`;
  ctx.shadowBlur = 30;
  ctx.fillText(text, 0, -8);

  ctx.shadowBlur = 0;
  ctx.font = `900 ${16 + strength * 1.5}px sans-serif`;
  ctx.fillStyle = '#182033';
  ctx.fillText(label, 0, 32 + strength * 2);
  ctx.restore();
}

function drawBurst(accent, strength) {
  ctx.save();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 4;
  for (let i = 0; i < 10; i += 1) {
    const angle = (Math.PI * 2 * i) / 10;
    const inner = 88 + strength * 4;
    const outer = 110 + strength * 8;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
    ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
    ctx.stroke();
  }
  ctx.restore();
}

function accidentSafe(color) {
  return color || '#ffffff';
}

function drawOverlay(text) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(0, 0, BOARD_SIZE, BOARD_SIZE);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 32px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, BOARD_WIDTH / 2, BOARD_HEIGHT / 2);
  ctx.restore();
}

function spawnParticles(gridPos, color, count = 10) {
  if (!gridPos) return;
  const baseX = gridPos.x * CELL_SIZE + CELL_SIZE / 2;
  const baseY = gridPos.y * CELL_SIZE + CELL_SIZE / 2;
  for (let i = 0; i < count; i += 1) {
    state.particles.push({
      x: baseX,
      y: baseY,
      vx: (Math.random() - 0.5) * 3.5,
      vy: (Math.random() - 0.5) * 3.5,
      life: 22 + Math.random() * 12,
      color,
      size: 3 + Math.random() * 3,
    });
  }
}

function updateAndDrawParticles() {
  state.particles = state.particles.filter((p) => p.life > 0);
  for (const p of state.particles) {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.02;
    p.life -= 1;
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.life / 30);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function roundRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

init();
