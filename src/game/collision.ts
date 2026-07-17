import { CONFIG } from '../config';
import type { Coin, Obstacle } from './spawner';
import type { PlayerAction } from '../config';

export interface PlayerBounds {
  x: number;
  y: number;
  z: number;
  halfW: number;
  halfH: number;
  halfD: number;
  action: PlayerAction;
}

function aabb(
  ax: number,
  ay: number,
  az: number,
  aw: number,
  ah: number,
  ad: number,
  bx: number,
  by: number,
  bz: number,
  bw: number,
  bh: number,
  bd: number,
): boolean {
  return (
    Math.abs(ax - bx) < aw + bw &&
    Math.abs(ay - by) < ah + bh &&
    Math.abs(az - bz) < ad + bd
  );
}

export function checkObstacleCollision(
  player: PlayerBounds,
  obstacles: Obstacle[],
): Obstacle | null {
  const near = obstacles.filter(
    (o) => Math.abs(o.z - player.z) < CONFIG.COLLISION_Z_WINDOW,
  );

  for (const o of near) {
    const ox = CONFIG.LANE_POSITIONS[o.lane];
    const hits = aabb(
      player.x,
      player.y,
      player.z,
      player.halfW,
      player.halfH,
      player.halfD,
      ox,
      o.y,
      o.z,
      o.width / 2,
      o.height / 2,
      o.depth / 2,
    );

    if (!hits) continue;

    if (o.type === 'low' && player.action === 'jumping') continue;
    if (o.type === 'high' && player.action === 'ducking') continue;

    return o;
  }

  return null;
}

export function checkCoinCollisions(
  player: PlayerBounds,
  coins: Coin[],
): number[] {
  const collected: number[] = [];
  const near = coins.filter(
    (c) => !c.collected && Math.abs(c.z - player.z) < CONFIG.COLLISION_Z_WINDOW,
  );

  for (const c of near) {
    const cx = CONFIG.LANE_POSITIONS[c.lane];
    const hits = aabb(
      player.x,
      player.y,
      player.z,
      player.halfW,
      player.halfH,
      player.halfD,
      cx,
      c.y,
      c.z,
      0.35,
      0.35,
      0.35,
    );
    if (hits) collected.push(c.id);
  }

  return collected;
}
