import type { ObstacleType } from '../config';
import { CONFIG } from '../config';

export interface Obstacle {
  id: number;
  lane: number;
  type: ObstacleType;
  z: number;
  width: number;
  height: number;
  depth: number;
  y: number;
}

export interface Coin {
  id: number;
  lane: number;
  z: number;
  y: number;
  collected: boolean;
}

let nextId = 1;

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Never fully block all 3 lanes. */
export function spawnObstacleWave(baseZ: number): Obstacle[] {
  const obstacles: Obstacle[] = [];
  const pattern = randInt(0, 5);

  const make = (lane: number, type: ObstacleType): Obstacle => {
    let height = 0.8;
    let y = 0.4;
    let width = 1.6;
    let depth = 0.6;

    if (type === 'low') {
      height = 0.7;
      y = 0.35;
    } else if (type === 'high') {
      height = 1.2;
      y = 1.7;
      width = 1.8;
    } else {
      height = 2.2;
      y = 1.1;
      width = 1.8;
      depth = 0.8;
    }

    return { id: nextId++, lane, type, z: baseZ, width, height, depth, y };
  };

  switch (pattern) {
    case 0: {
      // Single blocker in one lane
      obstacles.push(make(randInt(0, 2), 'blocker'));
      break;
    }
    case 1: {
      // Low barriers in 1-2 lanes
      const lanes = shuffle([0, 1, 2]).slice(0, randInt(1, 2));
      for (const l of lanes) obstacles.push(make(l, 'low'));
      break;
    }
    case 2: {
      // High barriers in 1-2 lanes
      const lanes = shuffle([0, 1, 2]).slice(0, randInt(1, 2));
      for (const l of lanes) obstacles.push(make(l, 'high'));
      break;
    }
    case 3: {
      // Two blockers, leave one open
      const open = randInt(0, 2);
      for (let l = 0; l < 3; l++) {
        if (l !== open) obstacles.push(make(l, 'blocker'));
      }
      break;
    }
    case 4: {
      // Mixed: low + high in different lanes, one free
      const lanes = shuffle([0, 1, 2]);
      obstacles.push(make(lanes[0], 'low'));
      obstacles.push(make(lanes[1], 'high'));
      break;
    }
    default: {
      // Blocker + low in different lanes
      const lanes = shuffle([0, 1, 2]);
      obstacles.push(make(lanes[0], 'blocker'));
      obstacles.push(make(lanes[1], pick(['low', 'high'] as ObstacleType[])));
      break;
    }
  }

  return obstacles;
}

export function spawnCoinPattern(baseZ: number): Coin[] {
  const coins: Coin[] = [];
  const pattern = randInt(0, 2);
  const lane = randInt(0, 2);

  if (pattern === 0) {
    // Line along one lane
    for (let i = 0; i < 5; i++) {
      coins.push({
        id: nextId++,
        lane,
        z: baseZ - i * 1.5,
        y: 1.0,
        collected: false,
      });
    }
  } else if (pattern === 1) {
    // Arc across lanes
    const seq = [0, 1, 2, 1, 0];
    for (let i = 0; i < seq.length; i++) {
      coins.push({
        id: nextId++,
        lane: seq[i],
        z: baseZ - i * 1.4,
        y: 1.0 + Math.sin(i * 0.8) * 0.3,
        collected: false,
      });
    }
  } else {
    // Two-lane stagger
    for (let i = 0; i < 4; i++) {
      coins.push({
        id: nextId++,
        lane: (lane + (i % 2)) % 3,
        z: baseZ - i * 1.6,
        y: 1.1,
        collected: false,
      });
    }
  }

  return coins;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function spawnIntervalForSpeed(speed: number): number {
  const t =
    CONFIG.BASE_SPAWN_INTERVAL -
    (speed - CONFIG.BASE_SPEED) * CONFIG.SPAWN_INTERVAL_SHRINK;
  return Math.max(CONFIG.MIN_SPAWN_INTERVAL, t);
}
