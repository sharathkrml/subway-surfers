import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CONFIG } from '../config';
import type { Obstacle } from './spawner';

const COLORS: Record<Obstacle['type'], string> = {
  low: '#e53935',
  high: '#8e24aa',
  blocker: '#fb8c00',
};

function ObstacleMesh({ obstacle }: { obstacle: Obstacle }) {
  const x = CONFIG.LANE_POSITIONS[obstacle.lane];
  return (
    <mesh position={[x, obstacle.y, obstacle.z]} castShadow>
      <boxGeometry args={[obstacle.width, obstacle.height, obstacle.depth]} />
      <meshStandardMaterial color={COLORS[obstacle.type]} roughness={0.5} metalness={0.15} />
    </mesh>
  );
}

export function Obstacles({ obstacles }: { obstacles: Obstacle[] }) {
  return (
    <group>
      {obstacles.map((o) => (
        <ObstacleMesh key={o.id} obstacle={o} />
      ))}
    </group>
  );
}

export function Coins({
  coins,
}: {
  coins: { id: number; lane: number; z: number; y: number; collected: boolean }[];
}) {
  return (
    <group>
      {coins
        .filter((c) => !c.collected)
        .map((c) => (
          <CoinMesh key={c.id} coin={c} />
        ))}
    </group>
  );
}

function CoinMesh({
  coin,
}: {
  coin: { lane: number; z: number; y: number };
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 4;
  });
  const x = CONFIG.LANE_POSITIONS[coin.lane];
  return (
    <mesh ref={ref} position={[x, coin.y, coin.z]} castShadow>
      <cylinderGeometry args={[0.35, 0.35, 0.1, 16]} />
      <meshStandardMaterial color="#ffd700" emissive="#ffaa00" emissiveIntensity={0.4} metalness={0.8} roughness={0.2} />
    </mesh>
  );
}
