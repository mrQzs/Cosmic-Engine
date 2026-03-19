'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useCosmicStore } from '@/stores/cosmicStore';

// Reusable Vector3 to avoid per-frame allocations
const _targetVec = new THREE.Vector3();

export default function CameraController() {
  const controlsRef = useRef<React.ComponentRef<typeof OrbitControls>>(null);
  const isTransitioning = useCosmicStore((s) => s.isTransitioning);
  const cameraTarget = useCosmicStore((s) => s.cameraTarget);

  useFrame(() => {
    if (!controlsRef.current) return;

    // Disable controls during GSAP fly-to transitions
    controlsRef.current.enabled = !isTransitioning;

    // Smoothly update orbit target (reuse vector to avoid GC pressure)
    _targetVec.set(cameraTarget[0], cameraTarget[1], cameraTarget[2]);
    controlsRef.current.target.lerp(_targetVec, 0.05);
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.05}
      autoRotate
      autoRotateSpeed={0.15}
      minDistance={10}
      maxDistance={2000}
      enablePan={false}
    />
  );
}
