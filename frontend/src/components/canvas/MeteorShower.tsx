'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { MeteorShowerConfig } from '@/hooks/useUniverseData';

interface MeteorShowerProps {
  config: MeteorShowerConfig;
}

interface MeteorState {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
}

function randomDirection(): THREE.Vector3 {
  return new THREE.Vector3(
    (Math.random() - 0.5) * 2,
    (Math.random() - 0.5) * 0.5,
    (Math.random() - 0.5) * 2,
  ).normalize();
}

function spawnMeteor(radius: number): MeteorState {
  const pos = new THREE.Vector3(
    (Math.random() - 0.5) * radius * 2,
    (Math.random() - 0.5) * radius * 0.5,
    (Math.random() - 0.5) * radius * 2,
  );
  const vel = randomDirection().multiplyScalar(80 + Math.random() * 120);
  const maxLife = 1.5 + Math.random() * 2;
  return { position: pos, velocity: vel, life: maxLife, maxLife };
}

const TRAIL_PER_METEOR = 8;

export default function MeteorShower({ config }: MeteorShowerProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const totalInstances = config.count * TRAIL_PER_METEOR;

  const meteors = useRef<MeteorState[]>(
    Array.from({ length: config.count }, () => spawnMeteor(config.spawnRadius)),
  );

  const color = useMemo(() => new THREE.Color(config.color), [config.color]);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const trails = useRef<THREE.Vector3[][]>(
    Array.from({ length: config.count }, () =>
      Array.from({ length: TRAIL_PER_METEOR }, () => new THREE.Vector3()),
    ),
  );

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    for (let m = 0; m < config.count; m++) {
      const meteor = meteors.current[m];
      meteor.life -= delta;

      if (meteor.life <= 0) {
        const fresh = spawnMeteor(config.spawnRadius);
        meteors.current[m] = fresh;
        for (let t = 0; t < TRAIL_PER_METEOR; t++) {
          trails.current[m][t].copy(fresh.position);
        }
        continue;
      }

      meteor.position.addScaledVector(meteor.velocity, delta);

      const trail = trails.current[m];
      for (let t = TRAIL_PER_METEOR - 1; t > 0; t--) {
        trail[t].copy(trail[t - 1]);
      }
      trail[0].copy(meteor.position);

      const lifeFraction = meteor.life / meteor.maxLife;
      for (let t = 0; t < TRAIL_PER_METEOR; t++) {
        const idx = m * TRAIL_PER_METEOR + t;
        const trailFade = 1 - t / TRAIL_PER_METEOR;
        const scale = Math.max(0.01, trailFade * lifeFraction * 0.5);

        dummy.position.copy(trail[t]);
        dummy.scale.setScalar(scale);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(idx, dummy.matrix);
      }
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, totalInstances]}>
      <sphereGeometry args={[1, 4, 4]} />
      <meshBasicMaterial color={color} transparent opacity={0.7} />
    </instancedMesh>
  );
}
