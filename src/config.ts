/** All tunable game & gesture constants — edit here to iterate quickly. */

export const CONFIG = {
  // --- Gesture detection (normalized by torsoHeight) ---
  JUMP_THRESHOLD: 0.18,
  DUCK_THRESHOLD: 0.15,
  LANE_THRESHOLD: 0.22,
  JUMP_WINDOW_MS: 300,
  JUMP_COOLDOWN_MS: 700,
  DUCK_HOLD_MS: 150,
  LANE_COOLDOWN_MS: 500,
  LANE_RETURN_RATIO: 0.4, // must return within this * LANE_THRESHOLD to rearm
  SMOOTHING_FRAMES: 4,
  CALIBRATION_MS: 3000,
  DUCK_END_TOLERANCE: 0.08, // return near baseline to end duck

  // --- Running (arm-pump / hand swing) ---
  // World only scrolls while this gesture is active.
  RUN_WINDOW_MS: 900,
  RUN_AMP_THRESHOLD: 0.12, // min peak-to-peak of (leftWristY - rightWristY) / torsoHeight
  RUN_MIN_CROSSINGS: 2, // zero-crossings of wrist-diff in the window
  RUN_DECAY_MS: 350, // keep scrolling briefly after pumps stop (smoother feel)
  RUN_KEYBOARD_INTENSITY: 1,

  // --- Lanes ---
  LANE_WIDTH: 2.2,
  LANE_POSITIONS: [-2.2, 0, 2.2] as const,
  LANE_SWITCH_MS: 180,

  // --- Player ---
  PLAYER_HEIGHT: 1.6,
  PLAYER_RADIUS: 0.35,
  JUMP_HEIGHT: 1.8,
  JUMP_DURATION_MS: 500,
  DUCK_SCALE_Y: 0.45,
  RUN_BOB_AMP: 0.08,
  RUN_BOB_SPEED: 12,

  // --- World / difficulty ---
  BASE_SPEED: 12,
  MAX_SPEED: 32,
  SPEED_RAMP_PER_SCORE: 0.012,
  SCORE_PER_SECOND: 10,
  COIN_SCORE: 50,

  // --- Spawning ---
  SPAWN_Z: -60,
  DESPAWN_Z: 8,
  BASE_SPAWN_INTERVAL: 1.8,
  MIN_SPAWN_INTERVAL: 0.75,
  SPAWN_INTERVAL_SHRINK: 0.018,
  COIN_SPAWN_CHANCE: 0.55,

  // --- Collision ---
  COLLISION_Z_WINDOW: 3,
  PLAYER_HALF_W: 0.4,
  PLAYER_HALF_H: 0.8,
  PLAYER_HALF_D: 0.35,

  // --- MediaPipe ---
  POSE_MODEL_URL:
    'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
  WASM_URL: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm',

  // Landmark indices (MediaPipe Pose)
  LM: {
    NOSE: 0,
    LEFT_SHOULDER: 11,
    RIGHT_SHOULDER: 12,
    LEFT_ELBOW: 13,
    RIGHT_ELBOW: 14,
    LEFT_WRIST: 15,
    RIGHT_WRIST: 16,
    LEFT_HIP: 23,
    RIGHT_HIP: 24,
  },
} as const;

export type GestureEvent =
  | 'jump'
  | 'duck-start'
  | 'duck-end'
  | 'lane-left'
  | 'lane-right'
  | 'center'
  | 'run-start'
  | 'run-end';

export type GameStatus = 'idle' | 'calibrating' | 'playing' | 'gameover';
export type PlayerAction = 'running' | 'jumping' | 'ducking';
export type ObstacleType = 'low' | 'high' | 'blocker';
