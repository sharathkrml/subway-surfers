import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CONFIG } from '../config';
import type { Obstacle } from './spawner';

function ObstacleMesh({ obstacle }: { obstacle: Obstacle }) {
  const x = CONFIG.LANE_POSITIONS[obstacle.lane];
  if (obstacle.type === 'blocker') {
    return (
      <group position={[x, 0, obstacle.z]}>
        <mesh position={[0, 1.22, 0]} castShadow>
          <boxGeometry args={[1.86, 2.44, 1.25]} />
          <meshStandardMaterial color="#167d95" roughness={0.55} metalness={0.2} />
        </mesh>
        <mesh position={[0, 2.18, 0.64]} rotation={[Math.PI / 2, 0, 0]}>
          <boxGeometry args={[1.5, 0.12, 0.48]} />
          <meshStandardMaterial color="#f4c542" />
        </mesh>
        {[-0.53, 0.53].map((windowX) => (
          <mesh key={windowX} position={[windowX, 1.55, 0.635]}>
            <boxGeometry args={[0.55, 0.5, 0.045]} />
            <meshStandardMaterial
              color="#a8e6f0"
              emissive="#4ba8bb"
              emissiveIntensity={0.35}
              roughness={0.2}
            />
          </mesh>
        ))}
        {[-0.62, 0.62].map((wheelX) => (
          <mesh key={wheelX} position={[wheelX, 0.25, 0.3]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.25, 0.25, 0.18, 14]} />
            <meshStandardMaterial color="#25323b" metalness={0.45} />
          </mesh>
        ))}
        <mesh position={[0, 0.78, 0.65]}>
          <boxGeometry args={[1.55, 0.16, 0.1]} />
          <meshStandardMaterial color="#f4c542" />
        </mesh>
      </group>
    );
  }

  if (obstacle.type === 'high') {
    return (
      <group position={[x, 0, obstacle.z]}>
        {[-0.82, 0.82].map((postX) => (
          <mesh key={postX} position={[postX, 1.08, 0]} castShadow>
            <boxGeometry args={[0.16, 2.16, 0.22]} />
            <meshStandardMaterial color="#424c55" metalness={0.6} />
          </mesh>
        ))}
        <mesh position={[0, 1.72, 0]} castShadow>
          <boxGeometry args={[1.85, 0.7, 0.28]} />
          <meshStandardMaterial color="#f04e38" roughness={0.65} />
        </mesh>
        {[-0.58, 0, 0.58].map((stripeX) => (
          <mesh key={stripeX} position={[stripeX, 1.72, 0.15]} rotation={[0, 0, -0.45]}>
            <boxGeometry args={[0.18, 0.82, 0.025]} />
            <meshStandardMaterial color="#fff2cf" />
          </mesh>
        ))}
        <mesh position={[0, 2.15, 0]}>
          <boxGeometry args={[1.3, 0.28, 0.2]} />
          <meshStandardMaterial color="#f4c542" />
        </mesh>
      </group>
    );
  }

  return (
    <group position={[x, 0, obstacle.z]}>
      {[-0.7, 0.7].map((postX) => (
        <mesh key={postX} position={[postX, 0.42, 0]} castShadow>
          <boxGeometry args={[0.14, 0.84, 0.2]} />
          <meshStandardMaterial color="#404952" metalness={0.55} />
        </mesh>
      ))}
      <mesh position={[0, obstacle.y, 0]} castShadow>
        <boxGeometry args={[obstacle.width, obstacle.height, obstacle.depth]} />
        <meshStandardMaterial color="#ffb703" roughness={0.6} />
      </mesh>
      {[-0.55, 0, 0.55].map((stripeX) => (
        <mesh key={stripeX} position={[stripeX, obstacle.y, obstacle.depth / 2 + 0.01]} rotation={[0, 0, -0.55]}>
          <boxGeometry args={[0.16, 0.78, 0.025]} />
          <meshStandardMaterial color="#202b36" />
        </mesh>
      ))}
      {[-0.72, 0.72].map((lightX) => (
        <pointLight key={lightX} position={[lightX, 0.62, 0.35]} color="#ff3b30" intensity={0.8} distance={2.5} />
      ))}
    </group>
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
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 4;
  });
  const x = CONFIG.LANE_POSITIONS[coin.lane];
  return (
    <group ref={ref} position={[x, coin.y, coin.z]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.25, 0.1, 10, 22]} />
        <meshStandardMaterial
          color="#ffd23f"
          emissive="#ff9f1c"
          emissiveIntensity={0.75}
          metalness={0.7}
          roughness={0.22}
        />
      </mesh>
      <pointLight color="#ffcc33" intensity={0.7} distance={2.2} />
    </group>
  );
}
