import { create } from 'zustand';
import { CONFIG, type GameStatus, type GestureEvent, type PlayerAction } from '../config';

const HIGH_SCORE_KEY = 'pose-runner-high-score';

function loadHighScore(): number {
  try {
    return Number(localStorage.getItem(HIGH_SCORE_KEY) ?? 0) || 0;
  } catch {
    return 0;
  }
}

function saveHighScore(score: number) {
  try {
    localStorage.setItem(HIGH_SCORE_KEY, String(score));
  } catch {
    /* ignore */
  }
}

interface GameState {
  status: GameStatus;
  score: number;
  coins: number;
  laneIndex: number;
  playerAction: PlayerAction;
  highScore: number;
  currentGesture: GestureEvent | 'none';
  cameraError: string | null;
  mediapipeError: string | null;
  debugVisible: boolean;
  speed: number;
  distance: number;
  stumbling: boolean;
  /** True while arm-pump running gesture is active */
  isRunning: boolean;
  /** Keyboard Shift hold (OR'd with isRunning for scroll) */
  keyboardRunning: boolean;
  /** 0–1 drive intensity from run gesture */
  runIntensity: number;

  setStatus: (status: GameStatus) => void;
  startCalibration: () => void;
  startGame: () => void;
  endGame: () => void;
  playAgain: () => void;
  resetToIdle: () => void;
  setLane: (index: number) => void;
  moveLane: (dir: -1 | 1) => void;
  setPlayerAction: (action: PlayerAction) => void;
  setCurrentGesture: (g: GestureEvent | 'none') => void;
  setRunning: (isRunning: boolean, intensity?: number) => void;
  setKeyboardRunning: (v: boolean) => void;
  addCoin: () => void;
  addScore: (amount: number) => void;
  setSpeed: (speed: number) => void;
  setDistance: (d: number) => void;
  setCameraError: (msg: string | null) => void;
  setMediapipeError: (msg: string | null) => void;
  toggleDebug: () => void;
  setStumbling: (v: boolean) => void;
  applyGesture: (event: GestureEvent) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  status: 'idle',
  score: 0,
  coins: 0,
  laneIndex: 1,
  playerAction: 'running',
  highScore: loadHighScore(),
  currentGesture: 'none',
  cameraError: null,
  mediapipeError: null,
  debugVisible: false,
  speed: 0,
  distance: 0,
  stumbling: false,
  isRunning: false,
  keyboardRunning: false,
  runIntensity: 0,

  setStatus: (status) => set({ status }),

  startCalibration: () =>
    set({
      status: 'calibrating',
      score: 0,
      coins: 0,
      laneIndex: 1,
      playerAction: 'running',
      currentGesture: 'none',
      speed: 0,
      distance: 0,
      stumbling: false,
      cameraError: null,
      isRunning: false,
      runIntensity: 0,
      keyboardRunning: false,
    }),

  startGame: () =>
    set({
      status: 'playing',
      score: 0,
      coins: 0,
      laneIndex: 1,
      playerAction: 'running',
      currentGesture: 'none',
      speed: 0,
      distance: 0,
      stumbling: false,
      isRunning: false,
      runIntensity: 0,
      keyboardRunning: false,
    }),

  endGame: () => {
    const { score, highScore } = get();
    const nextHigh = Math.max(score, highScore);
    if (nextHigh > highScore) saveHighScore(nextHigh);
    set({
      status: 'gameover',
      highScore: nextHigh,
      stumbling: true,
      playerAction: 'running',
      isRunning: false,
      runIntensity: 0,
      keyboardRunning: false,
      speed: 0,
    });
  },

  playAgain: () => get().startCalibration(),

  resetToIdle: () =>
    set({
      status: 'idle',
      score: 0,
      coins: 0,
      laneIndex: 1,
      playerAction: 'running',
      currentGesture: 'none',
      speed: 0,
      distance: 0,
      stumbling: false,
      isRunning: false,
      runIntensity: 0,
      keyboardRunning: false,
    }),

  setLane: (index) => set({ laneIndex: Math.max(0, Math.min(2, index)) }),

  moveLane: (dir) => {
    const next = get().laneIndex + dir;
    if (next >= 0 && next <= 2) set({ laneIndex: next });
  },

  setPlayerAction: (action) => set({ playerAction: action }),

  setCurrentGesture: (g) => set({ currentGesture: g }),

  setRunning: (isRunning, intensity = isRunning ? 1 : 0) =>
    set({ isRunning, runIntensity: isRunning ? intensity : 0 }),

  setKeyboardRunning: (v) =>
    set({
      keyboardRunning: v,
      ...(v ? { runIntensity: Math.max(get().runIntensity, CONFIG.RUN_KEYBOARD_INTENSITY) } : {}),
    }),

  addCoin: () =>
    set((s) => ({
      coins: s.coins + 1,
      score: s.score + 50,
    })),

  addScore: (amount) => set((s) => ({ score: s.score + amount })),

  setSpeed: (speed) => set({ speed }),
  setDistance: (d) => set({ distance: d }),

  setCameraError: (msg) => set({ cameraError: msg }),
  setMediapipeError: (msg) => set({ mediapipeError: msg }),

  toggleDebug: () => set((s) => ({ debugVisible: !s.debugVisible })),

  setStumbling: (v) => set({ stumbling: v }),

  applyGesture: (event) => {
    const { status, playerAction, moveLane, setPlayerAction, setCurrentGesture } = get();
    if (status !== 'playing') return;

    setCurrentGesture(event);

    switch (event) {
      case 'jump':
        if (playerAction !== 'jumping') setPlayerAction('jumping');
        break;
      case 'duck-start':
        if (playerAction !== 'jumping') setPlayerAction('ducking');
        break;
      case 'duck-end':
        if (playerAction === 'ducking') setPlayerAction('running');
        break;
      case 'lane-left':
        moveLane(-1);
        break;
      case 'lane-right':
        moveLane(1);
        break;
      case 'run-start':
      case 'run-end':
      case 'center':
        break;
    }
  },
}));
