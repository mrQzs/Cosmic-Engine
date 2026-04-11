'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { CometData } from '@/hooks/useUniverseData';

const TRAIL_LENGTH = 60;

interface CometProps {
  data: CometData;
  onClick?: (slug: string) => void;
}

export default function Comet({ data, onClick }: CometProps) {
  const headRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const trailRef = useRef<THREE.InstancedMesh>(null);
  const progressRef = useRef(Math.random());

  const curve = useMemo(() => {
    const points = data.pathPoints.map((p) => new THREE.Vector3(p.x, p.y, p.z));
    return new THREE.CatmullRomCurve3(points, true, 'centripetal', 0.5);
  }, [data.pathPoints]);

  const color = useMemo(() => new THREE.Color(data.color), [data.color]);

  const trailPositions = useRef<THREE.Vector3[]>(
    Array.from({ length: TRAIL_LENGTH }, () => new THREE.Vector3()),
  );

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((_, delta) => {
    if (!headRef.current || !trailRef.current) return;

    progressRef.current = (progressRef.current + data.speed * delta) % 1;

    const headPos = curve.getPointAt(progressRef.current);
    headRef.current.position.copy(headPos);
    if (glowRef.current) glowRef.current.position.copy(headPos);

    const positions = trailPositions.current;
    for (let i = positions.length - 1; i > 0; i--) {
      positions[i].copy(positions[i - 1]);
    }
    positions[0].copy(headPos);

    for (let i = 0; i < TRAIL_LENGTH; i++) {
      const t = i / TRAIL_LENGTH;
      const scale = Math.max(0.01, (1 - t) * 0.8);
      dummy.position.copy(positions[i]);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      trailRef.current.setMatrixAt(i, dummy.matrix);
    }
    trailRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <mesh ref={headRef} onClick={() => onClick?.(data.slug)}>
        <sphereGeometry args={[2, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.95} />
      </mesh>

      <mesh ref={glowRef}>
        <sphereGeometry args={[4, 8, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.15} />
      </mesh>

      <instancedMesh ref={trailRef} args={[undefined, undefined, TRAIL_LENGTH]}>
        <sphereGeometry args={[1, 4, 4]} />
        <meshBasicMaterial color={color} transparent opacity={0.4} />
      </instancedMesh>
    </group>
  );
}
