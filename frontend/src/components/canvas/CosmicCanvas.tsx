'use client';

import { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Bvh } from '@react-three/drei';
import * as THREE from 'three';
import { useCosmicStore } from '@/stores/cosmicStore';
import { QUALITY_DPR } from '@cosmic-engine/shared';
import { warmupShaders } from '@/utils/shaderWarmup';
import CanvasErrorBoundaryWrapper from '@/components/fallback/CanvasErrorBoundary';
import Universe from './Universe';
import CameraController from './CameraController';
import PostEffects from './PostEffects';

export default function CosmicCanvas() {
  const qualityLevel = useCosmicStore((s) => s.qualityLevel);

  const dpr = useMemo(() => {
    const tier = QUALITY_DPR[qualityLevel] ?? QUALITY_DPR.high;
    return [tier.min, tier.max] as [number, number];
  }, [qualityLevel]);

  return (
    <CanvasErrorBoundaryWrapper>
      <Canvas
        gl={{ antialias: true, alpha: false }}
        dpr={dpr}
        camera={{ fov: 60, near: 0.1, far: 5000, position: [0, 0, 500] }}
        style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}
        onCreated={({ gl, scene, camera }) => {
          gl.setClearColor('#0a0a1a');
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.1;
          gl.outputColorSpace = THREE.SRGBColorSpace;
          warmupShaders(gl, scene, camera);
        }}
      >
        <Bvh firstHitOnly>
          <Universe />
        </Bvh>
        <CameraController />
        <PostEffects />
      </Canvas>
    </CanvasErrorBoundaryWrapper>
  );
}
