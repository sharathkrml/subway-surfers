import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CONFIG } from '../config';

export function Track() {
  const matsRef = useRef<THREE.Mesh[]>([]);

  useFrame((_, delta) => {
    const speed = 0; // visual scroll handled by moving obstacles; animate lane stripes
    void speed;
    void delta;
  });

  const laneMarkers = useMemo(() => {
    const items: { x: number; z: number; key: string }[] = [];
    for (let z = -80; z < 20; z += 4) {
      items.push({ x: -CONFIG.LANE_WIDTH / 2, z, key: `l${z}` });
      items.push({ x: CONFIG.LANE_WIDTH / 2, z, key: `r${z}` });
    }
    return items;
  }, []);

  return (
    <group>
      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -30]} receiveShadow>
        <planeGeometry args={[14, 120]} />
        <meshStandardMaterial color="#2a2a3a" roughness={0.9} />
      </mesh>

      {/* Lane surfaces */}
      {CONFIG.LANE_POSITIONS.map((x, i) => (
        <mesh
          key={i}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[x, 0.01, -30]}
          receiveShadow
        >
          <planeGeometry args={[CONFIG.LANE_WIDTH * 0.9, 120]} />
          <meshStandardMaterial color={i === 1 ? '#3d3d55' : '#34344a'} roughness={0.85} />
        </mesh>
      ))}

      {/* Side rails */}
      <mesh position={[-4.2, 0.4, -30]}>
        <boxGeometry args={[0.3, 0.8, 120]} />
        <meshStandardMaterial color="#ff6b35" />
      </mesh>
      <mesh position={[4.2, 0.4, -30]}>
        <boxGeometry args={[0.3, 0.8, 120]} />
        <meshStandardMaterial color="#ff6b35" />
      </mesh>

      {/* Dashed lane lines (scroll visually via material offset if needed) */}
      {laneMarkers.map((m) => (
        <mesh
          key={m.key}
          ref={(el) => {
            if (el) matsRef.current.push(el);
          }}
          position={[m.x, 0.02, m.z]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[0.08, 1.5]} />
          <meshStandardMaterial color="#f0e68c" emissive="#f0e68c" emissiveIntensity={0.2} />
        </mesh>
      ))}
    </group>
  );
}
