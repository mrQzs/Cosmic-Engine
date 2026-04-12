'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { StarGateData } from '@/hooks/useUniverseData';

interface StarGateProps {
  data: StarGateData;
  onClick?: (id: string) => void;
  /**
   * Optional position override in the host parent's local space.
   * When a StarGate is mounted as a child of a Galaxy, the galaxy passes
   * a local offset here so the gate sits just outside the galactic rim.
   * Falls back to data.position (absolute universe coords) otherwise.
   */
  positionOverride?: [number, number, number];
}

export default function StarGate({ data, onClick, positionOverride }: StarGateProps) {
  const groupRef = useRef<THREE.Group>(null);
  const portalRef = useRef<THREE.Mesh>(null);
  const opacityRef = useRef(0.25);
  const hovered = useRef(false);

  const color = useMemo(() => new THREE.Color(data.color), [data.color]);
  const basePosition = useMemo<[number, number, number]>(
    () => positionOverride ?? [data.position.x, data.position.y, data.position.z],
    [positionOverride, data.position.x, data.position.y, data.position.z],
  );

  useFrame(({ clock }, delta) => {
    if (!groupRef.current || !portalRef.current) return;

    // Gentle bobbing (absolute time) around the configured base position
    groupRef.current.position.y = basePosition[1] + Math.sin(clock.elapsedTime * 0.5) * 2;

    // Slow rotation (absolute time)
    groupRef.current.rotation.y = clock.elapsedTime * 0.2;

    // Hover opacity (delta-scaled interpolation)
    const targetOpacity = hovered.current ? 0.6 : 0.25;
    opacityRef.current += (targetOpacity - opacityRef.current) * 3 * delta;

    const mat = portalRef.current.material as THREE.MeshBasicMaterial;
    mat.opacity = opacityRef.current;
  });

  return (
    <group
      ref={groupRef}
      position={basePosition}
      onClick={() => onClick?.(data.id)}
      onPointerEnter={() => {
        hovered.current = true;
      }}
      onPointerLeave={() => {
        hovered.current = false;
      }}
    >
      <mesh>
        <torusGeometry args={[6, 0.8, 12, 32]} />
        <meshStandardMaterial
          color={data.color}
          emissive={data.color}
          emissiveIntensity={0.4}
          roughness={0.4}
          metalness={0.7}
        />
      </mesh>

      <mesh ref={portalRef}>
        <circleGeometry args={[5.5, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>

      <pointLight color={data.color} intensity={1} distance={40} />
    </group>
  );
}
