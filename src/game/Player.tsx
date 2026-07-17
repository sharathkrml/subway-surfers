import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CONFIG } from '../config';
import { useGameStore } from '../state/gameStore';

export function Player() {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const laneIndex = useGameStore((s) => s.laneIndex);
  const playerAction = useGameStore((s) => s.playerAction);
  const stumbling = useGameStore((s) => s.stumbling);
  const isRunning = useGameStore((s) => s.isRunning || s.keyboardRunning);
  const setPlayerAction = useGameStore((s) => s.setPlayerAction);
  const status = useGameStore((s) => s.status);

  const currentX = useRef<number>(CONFIG.LANE_POSITIONS[1]);
  const jumpT = useRef(0);
  const bobT = useRef(0);

  useFrame((_, delta) => {
    const g = groupRef.current;
    const mesh = meshRef.current;
    if (!g || !mesh) return;

    const targetX = CONFIG.LANE_POSITIONS[laneIndex];
    const lerpSpeed = 1 - Math.pow(0.001, delta / (CONFIG.LANE_SWITCH_MS / 1000));
    currentX.current = THREE.MathUtils.lerp(currentX.current, targetX, lerpSpeed);
    g.position.x = currentX.current;
    g.position.z = 0;

    if (stumbling) {
      g.rotation.z = Math.sin(performance.now() * 0.02) * 0.4;
      g.rotation.x = 0.3;
      return;
    }
    g.rotation.z = 0;
    g.rotation.x = 0;

    if (status !== 'playing') {
      g.position.y = 0;
      mesh.scale.set(1, 1, 1);
      return;
    }

    bobT.current += delta * CONFIG.RUN_BOB_SPEED;
    let y = 0;
    let scaleY = 1;

    if (playerAction === 'jumping') {
      jumpT.current += delta;
      const t = jumpT.current / (CONFIG.JUMP_DURATION_MS / 1000);
      if (t >= 1) {
        jumpT.current = 0;
        setPlayerAction('running');
        y = 0;
      } else {
        y = 4 * CONFIG.JUMP_HEIGHT * t * (1 - t);
      }
      scaleY = 1;
    } else if (playerAction === 'ducking') {
      jumpT.current = 0;
      scaleY = CONFIG.DUCK_SCALE_Y;
      y = 0;
    } else {
      jumpT.current = 0;
      // Only bob while arm-pump running is active
      y = isRunning ? Math.sin(bobT.current) * CONFIG.RUN_BOB_AMP : 0;
      scaleY = 1;
    }

    g.position.y = y;
    mesh.scale.y = THREE.MathUtils.lerp(mesh.scale.y, scaleY, 1 - Math.pow(0.01, delta));
    mesh.position.y = (CONFIG.PLAYER_HEIGHT * mesh.scale.y) / 2;
  });

  // Expose live position via userData for collision (read from store elsewhere via refs in GameWorld)
  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <mesh ref={meshRef} position={[0, CONFIG.PLAYER_HEIGHT / 2, 0]} castShadow>
        <capsuleGeometry args={[CONFIG.PLAYER_RADIUS, CONFIG.PLAYER_HEIGHT - CONFIG.PLAYER_RADIUS * 2, 6, 12]} />
        <meshStandardMaterial color="#4fc3f7" roughness={0.4} metalness={0.2} />
      </mesh>
      {/* Head accent */}
      <mesh position={[0, CONFIG.PLAYER_HEIGHT + 0.05, 0]} castShadow>
        <sphereGeometry args={[0.22, 12, 12]} />
        <meshStandardMaterial color="#ffcc80" />
      </mesh>
    </group>
  );
}
