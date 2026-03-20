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

/** High-quality procedural starfield CubeTexture with nebula patches for visible lensing */
function createStarfieldCubeTexture(size = 512): THREE.CubeTexture {
  const faces: HTMLCanvasElement[] = [];
  for (let f = 0; f < 6; f++) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#050510';
    ctx.fillRect(0, 0, size, size);

    // Nebula glow patches — gives the lensing something bright to distort
    const nebulaCount = 3 + Math.floor(Math.random() * 4);
    for (let n = 0; n < nebulaCount; n++) {
      const nx = Math.random() * size;
      const ny = Math.random() * size;
      const nr = 50 + Math.random() * 100;
      const grad = ctx.createRadialGradient(nx, ny, 0, nx, ny, nr);
      const hue = Math.floor(Math.random() * 60 + 200); // blue-purple range
      grad.addColorStop(0, `hsla(${hue}, 60%, 40%, 0.18)`);
      grad.addColorStop(0.5, `hsla(${hue}, 50%, 25%, 0.08)`);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);
    }

    // Stars — brighter and more varied for visible lensing distortion
    const starCount = 600;
    for (let i = 0; i < starCount; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const isBright = Math.random() < 0.1;
      const r = isBright ? 1.0 + Math.random() * 2.0 : Math.random() * 1.2 + 0.3;
      const brightness = isBright ? 0.8 + Math.random() * 0.2 : 0.4 + Math.random() * 0.6;

      // Varied star colors
      const colorRoll = Math.random();
      let sr: number, sg: number, sb: number;
      if (colorRoll < 0.6) {
        sr = 200 + Math.random() * 55;
        sg = 210 + Math.random() * 45;
        sb = 230 + Math.random() * 25;
      } // white-blue
      else if (colorRoll < 0.8) {
        sr = 255;
        sg = 220 + Math.random() * 35;
        sb = 150 + Math.random() * 50;
      } // yellow
      else if (colorRoll < 0.95) {
        sr = 255;
        sg = 160 + Math.random() * 60;
        sb = 100 + Math.random() * 40;
      } // orange
      else {
        sr = 150 + Math.random() * 50;
        sg = 180 + Math.random() * 50;
        sb = 255;
      } // hot blue

      ctx.fillStyle = `rgba(${sr}, ${sg}, ${sb}, ${brightness})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();

      // Glow halo for bright stars
      if (isBright) {
        const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 4);
        glow.addColorStop(0, `rgba(${sr}, ${sg}, ${sb}, 0.35)`);
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, r * 4, 0, Math.PI * 2);
        ctx.fill();
      }
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

const _parentQuat = new THREE.Quaternion();

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
      u_schwarzschildRadius: { value: 0.3 },
      u_accretionColor: { value: new THREE.Color(accentColor) },
      u_maxSteps: { value: 128 },
      u_envMap: { value: envMap },
    }),
    [accentColor, envMap, size.width, size.height],
  );

  useFrame(({ clock }) => {
    uniforms.u_time.value = clock.elapsedTime;
    // Billboard: always face camera, accounting for parent rotation
    if (meshRef.current) {
      // mesh.worldQuat = parent.worldQuat × mesh.localQuat
      // 要 mesh.worldQuat = camera.quat
      // → mesh.localQuat = parent.worldQuat⁻¹ × camera.quat
      if (meshRef.current.parent) {
        meshRef.current.parent.getWorldQuaternion(_parentQuat);
        meshRef.current.quaternion.copy(_parentQuat.invert().multiply(camera.quaternion));
      } else {
        meshRef.current.quaternion.copy(camera.quaternion);
      }
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
