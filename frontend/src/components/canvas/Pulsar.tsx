'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { PulsarData } from '@/hooks/useUniverseData';

interface PulsarProps {
  data: PulsarData;
  onClick?: () => void;
}

const JET_COUNT = 80;

export default function Pulsar({ data, onClick }: PulsarProps) {
  const coreRef = useRef<THREE.Mesh>(null);
  const jetTopRef = useRef<THREE.InstancedMesh>(null);
  const jetBottomRef = useRef<THREE.InstancedMesh>(null);
  const glowRef = useRef<THREE.PointLight>(null);

  const color = useMemo(() => new THREE.Color(data.color), [data.color]);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;

    if (coreRef.current) {
      coreRef.current.rotation.y = t * data.rotationSpeed;
    }

    const pulse = Math.sin(t * data.rotationSpeed * 2) * 0.5 + 0.5;
    if (glowRef.current) {
      glowRef.current.intensity = 2 + pulse * 4;
    }

    const updateJet = (mesh: THREE.InstancedMesh | null, direction: number) => {
      if (!mesh) return;
      for (let i = 0; i < JET_COUNT; i++) {
        const progress = (t * 2 + i * 0.05) % 1.5;
        const y = progress * 40 * direction;
        const spread = progress * 3;
        const angle = i * 2.399 + t;
        const x = Math.cos(angle) * spread;
        const z = Math.sin(angle) * spread;
        const scale = Math.max(0.01, (1 - progress / 1.5) * 0.6);

        dummy.position.set(x, y, z);
        dummy.scale.setScalar(scale);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    };

    updateJet(jetTopRef.current, 1);
    updateJet(jetBottomRef.current, -1);
  });

  return (
    <group position={[data.position.x, data.position.y, data.position.z]} onClick={onClick}>
      <mesh ref={coreRef}>
        <sphereGeometry args={[3, 24, 24]} />
        <meshStandardMaterial
          color={data.color}
          emissive={data.color}
          emissiveIntensity={1.5}
          roughness={0.2}
          metalness={0.9}
        />
      </mesh>

      <mesh>
        <sphereGeometry args={[5, 12, 12]} />
        <meshBasicMaterial color={color} transparent opacity={0.1} />
      </mesh>

      <instancedMesh ref={jetTopRef} args={[undefined, undefined, JET_COUNT]}>
        <sphereGeometry args={[0.5, 4, 4]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} />
      </instancedMesh>

      <instancedMesh ref={jetBottomRef} args={[undefined, undefined, JET_COUNT]}>
        <sphereGeometry args={[0.5, 4, 4]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} />
      </instancedMesh>

      <pointLight ref={glowRef} color={data.color} intensity={3} distance={100} />
    </group>
  );
}
