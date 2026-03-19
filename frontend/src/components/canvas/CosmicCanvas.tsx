'use client';

import { Canvas } from '@react-three/fiber';
import { Bvh } from '@react-three/drei';
import Universe from './Universe';
import CameraController from './CameraController';
import PostEffects from './PostEffects';

export default function CosmicCanvas() {
  return (
    <Canvas
      gl={{ antialias: true, alpha: false }}
      dpr={[1, 1.5]}
      camera={{ fov: 60, near: 0.1, far: 5000, position: [0, 0, 500] }}
      style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}
      onCreated={({ gl }) => {
        gl.setClearColor('#0a0a1a');
      }}
    >
      <Bvh firstHitOnly>
        <Universe />
      </Bvh>
      <CameraController />
      <PostEffects />
    </Canvas>
  );
}
