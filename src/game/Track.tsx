import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CONFIG } from '../config';
import { useGameStore } from '../state/gameStore';

export function Track() {
  const sceneryRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    const speed = useGameStore.getState().speed;
    if (!sceneryRef.current || speed <= 0) return;
    sceneryRef.current.children.forEach((segment) => {
      segment.position.z += speed * delta;
      if (segment.position.z > 12) segment.position.z -= 96;
    });
  });

  const segments = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      z: 8 - i * 8,
      leftHeight: 3.5 + ((i * 7) % 5) * 0.7,
      rightHeight: 4 + ((i * 11) % 4) * 0.8,
      accent: i % 3,
    }));
  }, []);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -30]} receiveShadow>
        <planeGeometry args={[40, 130]} />
        <meshStandardMaterial color="#8e6b52" roughness={1} />
      </mesh>

      <group ref={sceneryRef}>
        {segments.map((segment, i) => (
          <group key={i} position={[0, 0, segment.z]}>
            {/* sleepers under all three tracks */}
            <mesh position={[0, 0.075, 0]} receiveShadow>
              <boxGeometry args={[7.9, 0.15, 0.34]} />
              <meshStandardMaterial color={i % 2 ? '#493329' : '#543a2e'} roughness={1} />
            </mesh>

            {CONFIG.LANE_POSITIONS.map((x) => (
              <group key={x}>
                <mesh position={[x - 0.62, 0.2, 0]}>
                  <boxGeometry args={[0.1, 0.12, 8]} />
                  <meshStandardMaterial color="#b8c2c7" metalness={0.8} roughness={0.28} />
                </mesh>
                <mesh position={[x + 0.62, 0.2, 0]}>
                  <boxGeometry args={[0.1, 0.12, 8]} />
                  <meshStandardMaterial color="#b8c2c7" metalness={0.8} roughness={0.28} />
                </mesh>
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.015, 0]}>
                  <planeGeometry args={[1.55, 8]} />
                  <meshStandardMaterial color="#66574c" roughness={1} />
                </mesh>
              </group>
            ))}

            {/* colorful city canyon */}
            <Building
              position={[-7.2, segment.leftHeight / 2, 0]}
              height={segment.leftHeight}
              color={['#f05a47', '#ffc145', '#35a7a0'][segment.accent]}
              side="left"
            />
            <Building
              position={[7.2, segment.rightHeight / 2, 0]}
              height={segment.rightHeight}
              color={['#3c78d8', '#ef476f', '#8d5cc6'][segment.accent]}
              side="right"
            />

            <mesh position={[-4.45, 0.8, 0]}>
              <boxGeometry args={[0.18, 1.6, 8]} />
              <meshStandardMaterial color="#f3bb42" roughness={0.7} />
            </mesh>
            <mesh position={[4.45, 0.8, 0]}>
              <boxGeometry args={[0.18, 1.6, 8]} />
              <meshStandardMaterial color="#f3bb42" roughness={0.7} />
            </mesh>

            {i % 3 === 0 && (
              <group position={[4.25, 0, -1.5]}>
                <mesh position={[0, 2.5, 0]}>
                  <boxGeometry args={[0.12, 5, 0.12]} />
                  <meshStandardMaterial color="#34495e" />
                </mesh>
                <mesh position={[-0.5, 4.7, 0]}>
                  <boxGeometry args={[1.1, 0.12, 0.12]} />
                  <meshStandardMaterial color="#34495e" />
                </mesh>
                <pointLight position={[-1, 4.45, 0]} color="#ffd96a" intensity={1.8} distance={7} />
              </group>
            )}
          </group>
        ))}
      </group>
    </group>
  );
}

function Building({
  position,
  height,
  color,
  side,
}: {
  position: [number, number, number];
  height: number;
  color: string;
  side: 'left' | 'right';
}) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[5, height, 7.8]} />
        <meshStandardMaterial color={color} roughness={0.82} />
      </mesh>
      {[-2.4, 0, 2.4].map((z, index) => (
        <mesh
          key={z}
          position={[side === 'left' ? 2.51 : -2.51, 0.6 + (index % 2) * 0.7, z]}
          rotation={[0, side === 'left' ? Math.PI / 2 : -Math.PI / 2, 0]}
        >
          <planeGeometry args={[0.95, 1.15]} />
          <meshStandardMaterial
            color={index === 1 ? '#fff2a8' : '#87d7e8'}
            emissive={index === 1 ? '#f7b32b' : '#287b8e'}
            emissiveIntensity={0.28}
          />
        </mesh>
      ))}
      <mesh position={[side === 'left' ? 2.55 : -2.55, -height / 2 + 1.15, 0]}>
        <boxGeometry args={[0.16, 1.1, 3.2]} />
        <meshStandardMaterial color="#273746" />
      </mesh>
    </group>
  );
}
