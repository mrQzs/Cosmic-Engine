'use client';

import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import blackHoleFragSource from '@/shaders/blackHole.frag.glsl';

const FULLSCREEN_VERT = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

/** Generate a procedural starfield CubeTexture (no external files needed) */
function createStarfieldCubeTexture(size = 256): THREE.CubeTexture {
  const faces: HTMLCanvasElement[] = [];
  for (let f = 0; f < 6; f++) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#020208';
    ctx.fillRect(0, 0, size, size);
    const starCount = 200;
    for (let i = 0; i < starCount; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = Math.random() * 1.2 + 0.3;
      const brightness = 0.4 + Math.random() * 0.6;
      ctx.fillStyle = `rgba(${180 + Math.random() * 75}, ${190 + Math.random() * 65}, ${220 + Math.random() * 35}, ${brightness})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    faces.push(canvas);
  }
  const cubeTexture = new THREE.CubeTexture(faces);
  cubeTexture.needsUpdate = true;
  return cubeTexture;
}

interface BlackHoleProps {
  accentColor?: string;
  radius?: number;
  onClick?: () => void;
}

export default function BlackHole({
  accentColor = '#ff6622',
  radius = 8,
  onClick,
}: BlackHoleProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { size, camera } = useThree();

  const envMap = useMemo(() => createStarfieldCubeTexture(), []);

  const uniforms = useMemo(
    () => ({
      u_time: { value: 0 },
      u_resolution: { value: new THREE.Vector2(size.width, size.height) },
      u_schwarzschildRadius: { value: 0.25 },
      u_accretionColor: { value: new THREE.Color(accentColor) },
      u_maxSteps: { value: 64 },
      u_envMap: { value: envMap },
    }),
    [accentColor, envMap, size.width, size.height],
  );

  useFrame(({ clock }) => {
    uniforms.u_time.value = clock.elapsedTime;
    // Billboard: always face camera
    if (meshRef.current) {
      meshRef.current.quaternion.copy(camera.quaternion);
    }
  });

  useEffect(() => {
    return () => {
      envMap.dispose();
    };
  }, [envMap]);

  return (
    <mesh ref={meshRef} onClick={onClick}>
      <planeGeometry args={[radius * 2, radius * 2]} />
      <shaderMaterial
        vertexShader={FULLSCREEN_VERT}
        fragmentShader={blackHoleFragSource}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
