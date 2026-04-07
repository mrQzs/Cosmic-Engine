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

// Scene-to-shader coordinate scale.
// Shader space: rs=0.3, disk 0.9–2.4, typical view at ~5 units.
// Scene space: billboard radius in scene units.
// SHADER_SCALE = radius / shaderHalfView (how many shader units the billboard covers)
const SHADER_HALF_VIEW = 4.0; // Billboard covers ±4 shader units

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

    // Stars — subtle for background lensing, not dominant
    const starCount = 300;
    for (let i = 0; i < starCount; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const isBright = Math.random() < 0.05;
      const r = isBright ? 0.8 + Math.random() * 1.0 : Math.random() * 0.8 + 0.2;
      const brightness = isBright ? 0.5 + Math.random() * 0.2 : 0.2 + Math.random() * 0.3;

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
const _invParentQuat = new THREE.Quaternion();
const _camLocal = new THREE.Vector3();
const _camRight = new THREE.Vector3();
const _camUp = new THREE.Vector3();

export default function BlackHole({
  accentColor = '#ff6622',
  radius = 8,
  onClick,
}: BlackHoleProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();

  const envMap = useMemo(() => createStarfieldCubeTexture(), []);

  // Scale factor: scene units → shader units
  const shaderScale = radius / SHADER_HALF_VIEW;

  const uniforms = useMemo(
    () => ({
      u_time: { value: 0 },
      u_schwarzschildRadius: { value: 0.3 },
      u_accretionColor: { value: new THREE.Color(accentColor) },
      u_maxSteps: { value: 128 },
      u_envMap: { value: envMap },
      u_cameraLocalPos: { value: new THREE.Vector3(0, 0.3, 5) },
      u_billboardHalfSize: { value: SHADER_HALF_VIEW },
      u_cameraRight: { value: new THREE.Vector3(1, 0, 0) },
      u_cameraUp: { value: new THREE.Vector3(0, 1, 0) },
    }),
    [accentColor, envMap],
  );

  useFrame(({ clock }) => {
    uniforms.u_time.value = clock.elapsedTime;

    if (!meshRef.current) return;

    // Billboard: always face camera, accounting for parent rotation.
    // Also compute camera basis vectors in galaxy-local space for the shader.
    if (meshRef.current.parent) {
      meshRef.current.parent.getWorldQuaternion(_parentQuat);
      _invParentQuat.copy(_parentQuat).invert();

      // Billboard orientation: local quat = parentInv × cameraQuat
      meshRef.current.quaternion.copy(_invParentQuat).multiply(camera.quaternion);

      // Camera position in galaxy-local space → shader coordinates
      _camLocal.copy(camera.position);
      meshRef.current.parent.worldToLocal(_camLocal);
      _camLocal.divideScalar(shaderScale);
      uniforms.u_cameraLocalPos.value.copy(_camLocal);

      // Camera right/up basis vectors in galaxy-local space
      // These match the billboard's UV axes, ensuring correct ray orientation.
      _camRight.set(1, 0, 0).applyQuaternion(camera.quaternion).applyQuaternion(_invParentQuat);
      _camUp.set(0, 1, 0).applyQuaternion(camera.quaternion).applyQuaternion(_invParentQuat);
      uniforms.u_cameraRight.value.copy(_camRight);
      uniforms.u_cameraUp.value.copy(_camUp);
    } else {
      meshRef.current.quaternion.copy(camera.quaternion);
      _camLocal.copy(camera.position).divideScalar(shaderScale);
      uniforms.u_cameraLocalPos.value.copy(_camLocal);
      _camRight.set(1, 0, 0).applyQuaternion(camera.quaternion);
      _camUp.set(0, 1, 0).applyQuaternion(camera.quaternion);
      uniforms.u_cameraRight.value.copy(_camRight);
      uniforms.u_cameraUp.value.copy(_camUp);
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
