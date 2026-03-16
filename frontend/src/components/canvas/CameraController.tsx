'use client';

import { OrbitControls } from '@react-three/drei';

export default function CameraController() {
  return (
    <OrbitControls
      enableDamping
      dampingFactor={0.05}
      autoRotate
      autoRotateSpeed={0.15}
      minDistance={50}
      maxDistance={2000}
      enablePan={false}
    />
  );
}
