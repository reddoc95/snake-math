export const GRID_COLS = 14;
export const GRID_ROWS = 20;
export const GRID_SIZE = GRID_COLS;
export const CELL_SIZE = 30;
export const BOARD_WIDTH = GRID_COLS * CELL_SIZE;
export const BOARD_HEIGHT = GRID_ROWS * CELL_SIZE;
export const BOARD_SIZE = BOARD_WIDTH;

export const START_LENGTH = 3;
export const MIN_LENGTH = 2;
export const TARGET_LENGTH = 22;
export const START_LIVES = 3;

export const SCORE = {
  correct: 10,
  wrong: -5,
  stageClear: 50,
  lifeBonus: 20,
};

export const STAGE_SPEEDS = {
  1: 380,
  2: 330,
  3: 290,
  4: 250,
  5: 220,
};

export const THEMES = {
  1: {
    name: '초원',
    englishName: 'Green Field',
    className: 'theme-stage-1',
    boardGlow: 'rgba(143, 227, 136, 0.16)',
    gridColor: 'rgba(255,255,255,0.15)',
    backdropA: 'rgba(255,255,255,0.08)',
    backdropB: 'rgba(255,255,255,0.02)',
    accent: '#8fe388',
    deco: 'leaf',
    snakeHeadA: '#ff9c6b',
    snakeHeadB: '#ff5f6d',
    snakeBodyA: '#ffd86f',
    snakeBodyB: '#a8ff78',
    tileA: '#ffffff',
    tileB: '#eaffea',
  },
  2: {
    name: '바다',
    englishName: 'Blue Ocean',
    className: 'theme-stage-2',
    boardGlow: 'rgba(123, 220, 255, 0.18)',
    gridColor: 'rgba(255,255,255,0.16)',
    backdropA: 'rgba(255,255,255,0.08)',
    backdropB: 'rgba(255,255,255,0.02)',
    accent: '#7bdcff',
    deco: 'bubble',
    snakeHeadA: '#66d9ff',
    snakeHeadB: '#3b82f6',
    snakeBodyA: '#a5f3fc',
    snakeBodyB: '#60a5fa',
    tileA: '#ffffff',
    tileB: '#e0f7ff',
  },
  3: {
    name: '우주',
    englishName: 'Deep Space',
    className: 'theme-stage-3',
    boardGlow: 'rgba(200, 182, 255, 0.18)',
    gridColor: 'rgba(255,255,255,0.12)',
    backdropA: 'rgba(255,255,255,0.06)',
    backdropB: 'rgba(255,255,255,0.015)',
    accent: '#c8b6ff',
    deco: 'star',
    snakeHeadA: '#d8b4fe',
    snakeHeadB: '#7c3aed',
    snakeBodyA: '#c4b5fd',
    snakeBodyB: '#312e81',
    tileA: '#f8f7ff',
    tileB: '#dfe4ff',
  },
  4: {
    name: '사탕나라',
    shortName: '사탕나라',
    englishName: 'Candy Pop',
    className: 'theme-stage-4',
    boardGlow: 'rgba(255, 176, 218, 0.2)',
    gridColor: 'rgba(255,255,255,0.16)',
    backdropA: 'rgba(255,255,255,0.09)',
    backdropB: 'rgba(255,255,255,0.02)',
    accent: '#ffb0da',
    deco: 'candy',
    snakeHeadA: '#ff9ed2',
    snakeHeadB: '#fb7185',
    snakeBodyA: '#ffd6f2',
    snakeBodyB: '#f9a8d4',
    tileA: '#fff7ff',
    tileB: '#ffe0f2',
  },
  5: {
    name: '보물신전',
    shortName: '보물신전',
    englishName: 'Treasure Temple',
    className: 'theme-stage-5',
    boardGlow: 'rgba(255, 224, 138, 0.2)',
    gridColor: 'rgba(255,255,255,0.16)',
    backdropA: 'rgba(255,255,255,0.08)',
    backdropB: 'rgba(255,255,255,0.02)',
    accent: '#ffe08a',
    deco: 'gem',
    snakeHeadA: '#ffd86b',
    snakeHeadB: '#f59e0b',
    snakeBodyA: '#ffefb0',
    snakeBodyB: '#facc15',
    tileA: '#fffaf0',
    tileB: '#ffe9b8',
  },
};

export const MAX_STAGE = Object.keys(THEMES).length;

export const ITEM_TYPES = {
  GROW: 'grow',
  SHRINK: 'shrink',
  FAST: 'fast',
  SLOW: 'slow',
  RESET: 'reset',
  HINT: 'hint',
};

export const ITEM_META = {
  [ITEM_TYPES.GROW]: { emoji: '🍎', color: '#ff6b6b', label: '성장 +2' },
  [ITEM_TYPES.SHRINK]: { emoji: '💣', color: '#555', label: '축소 -3' },
  [ITEM_TYPES.FAST]: { emoji: '⚡', color: '#ffd43b', label: '속도 증가' },
  [ITEM_TYPES.SLOW]: { emoji: '🧊', color: '#74c0fc', label: '속도 감소' },
  [ITEM_TYPES.RESET]: { emoji: '🌀', color: '#9775fa', label: '길이 초기화' },
  [ITEM_TYPES.HINT]: { emoji: '⭐', color: '#fcc419', label: '정답 힌트' },
};
