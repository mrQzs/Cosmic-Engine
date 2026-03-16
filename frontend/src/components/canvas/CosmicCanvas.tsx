'use client';

import { Canvas } from '@react-three/fiber';
import Starfield from './Starfield';
import CameraController from './CameraController';

export default function CosmicCanvas() {
  return (
    <Canvas
      gl={{ antialias: true, alpha: false }}
      dpr={[1, 1.5]}
      camera={{ fov: 60, near: 0.1, far: 5000, position: [0, 0, 500] }}
      style={{ width: '100%', height: '100%' }}
      onCreated={({ gl }) => {
        gl.setClearColor('#0a0a1a');
      }}
    >
      <ambientLight intensity={0.3} />
      <Starfield />
      <CameraController />
    </Canvas>
  );
}
