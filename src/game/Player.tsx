import { useRef } from 'react';
import type { ReactNode, Ref } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CONFIG } from '../config';
import { useGameStore } from '../state/gameStore';

export function Player() {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
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
    const body = bodyRef.current;
    if (!g || !body) return;

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
      body.scale.set(1, 1, 1);
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
    body.scale.y = THREE.MathUtils.lerp(body.scale.y, scaleY, 1 - Math.pow(0.01, delta));
    body.position.y = playerAction === 'ducking' ? 0.14 : 0;

    const stride = isRunning ? Math.sin(bobT.current) * 0.72 : 0;
    if (leftArmRef.current) leftArmRef.current.rotation.x = stride;
    if (rightArmRef.current) rightArmRef.current.rotation.x = -stride;
    if (leftLegRef.current) leftLegRef.current.rotation.x = -stride * 0.72;
    if (rightLegRef.current) rightLegRef.current.rotation.x = stride * 0.72;
    body.rotation.x = playerAction === 'ducking' ? -0.42 : 0;
  });

  return (
    <group ref={groupRef}>
      <group ref={bodyRef}>
        {/* sneakers and legs */}
        <Limb ref={leftLegRef} position={[-0.2, 0.72, 0]} color="#24415c" length={0.72}>
          <mesh position={[0, -0.76, 0.12]} castShadow>
            <boxGeometry args={[0.27, 0.18, 0.5]} />
            <meshStandardMaterial color="#f8f6e9" roughness={0.65} />
          </mesh>
        </Limb>
        <Limb ref={rightLegRef} position={[0.2, 0.72, 0]} color="#24415c" length={0.72}>
          <mesh position={[0, -0.76, 0.12]} castShadow>
            <boxGeometry args={[0.27, 0.18, 0.5]} />
            <meshStandardMaterial color="#f8f6e9" roughness={0.65} />
          </mesh>
        </Limb>

        {/* oversized streetwear hoodie */}
        <mesh position={[0, 1.28, 0]} castShadow>
          <capsuleGeometry args={[0.38, 0.55, 5, 12]} />
          <meshStandardMaterial color="#ef3e54" roughness={0.72} />
        </mesh>
        <mesh position={[0, 1.28, 0.35]}>
          <circleGeometry args={[0.2, 20]} />
          <meshStandardMaterial color="#ffd23f" roughness={0.65} />
        </mesh>
        <mesh position={[0, 1.72, -0.11]} rotation={[0.35, 0, 0]} castShadow>
          <torusGeometry args={[0.25, 0.13, 8, 20, Math.PI]} />
          <meshStandardMaterial color="#d72e43" />
        </mesh>

        <Limb ref={leftArmRef} position={[-0.42, 1.48, 0]} color="#ef3e54" length={0.58} />
        <Limb ref={rightArmRef} position={[0.42, 1.48, 0]} color="#ef3e54" length={0.58} />

        {/* head, ears, hair and cap */}
        <mesh position={[0, 1.98, 0]} castShadow>
          <sphereGeometry args={[0.3, 16, 14]} />
          <meshStandardMaterial color="#c8794d" roughness={0.8} />
        </mesh>
        <mesh position={[0, 2.17, -0.02]} castShadow>
          <sphereGeometry args={[0.31, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#34231f" roughness={0.95} />
        </mesh>
        <mesh position={[0, 2.22, 0.05]} rotation={[-0.12, 0, 0]} castShadow>
          <cylinderGeometry args={[0.32, 0.3, 0.14, 20]} />
          <meshStandardMaterial color="#32a4d8" roughness={0.6} />
        </mesh>
        <mesh position={[0, 2.19, 0.31]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <boxGeometry args={[0.42, 0.3, 0.07]} />
          <meshStandardMaterial color="#ffd23f" roughness={0.65} />
        </mesh>
      </group>
    </group>
  );
}

const Limb = ({
  position,
  color,
  length,
  children,
  ref,
}: {
  position: [number, number, number];
  color: string;
  length: number;
  children?: ReactNode;
  ref?: Ref<THREE.Group>;
}) => (
  <group ref={ref} position={position}>
    <mesh position={[0, -length / 2, 0]} castShadow>
      <capsuleGeometry args={[0.13, length - 0.16, 5, 9]} />
      <meshStandardMaterial color={color} roughness={0.75} />
    </mesh>
    {children}
  </group>
);
