'use client';

import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface GalaxyLight {
  position: [number, number, number];
  color: string;
}

interface LightingSystemProps {
  galaxyLights?: GalaxyLight[];
}

const MAX_POINT_LIGHTS = 8;

export default function LightingSystem({ galaxyLights = [] }: LightingSystemProps) {
  const cameraLightRef = useRef<THREE.PointLight>(null);
  const { camera } = useThree();

  useFrame(() => {
    if (cameraLightRef.current) {
      cameraLightRef.current.position.copy(camera.position);
    }
  });

  // Only render the nearest MAX_POINT_LIGHTS galaxy lights
  const activeLights = galaxyLights.slice(0, MAX_POINT_LIGHTS);

  return (
    <>
      <ambientLight intensity={0.12} />
      <hemisphereLight args={['#e2e8f0', '#0a0a1a', 0.08]} />
      <pointLight ref={cameraLightRef} intensity={0.3} distance={500} decay={2} color="#e2e8f0" />
      {activeLights.map((light, i) => (
        <pointLight
          key={i}
          position={light.position}
          color={light.color}
          intensity={0.8}
          distance={400}
          decay={2}
        />
      ))}
    </>
  );
}
