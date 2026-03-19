'use client';

import { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import fresnelFragSource from '@/shaders/fresnel.frag.glsl';

const FRESNEL_VERT = `
varying vec3 vNormal;
varying vec3 vViewDir;
void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vNormal  = normalize(normalMatrix * normal);
    vViewDir = normalize(cameraPosition - worldPos.xyz);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

interface AtmosphereProps {
  radius: number;
  color: string;
  fresnelPower?: number;
  opacity?: number;
}

export default function Atmosphere({
  radius,
  color,
  fresnelPower = 3.0,
  opacity = 1.0,
}: AtmosphereProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const uniforms = useMemo(
    () => ({
      u_fresnelPower: { value: fresnelPower },
      u_atmosphereColor: { value: new THREE.Color(color) },
      u_opacity: { value: opacity },
    }),
    [fresnelPower, color, opacity],
  );

  // Dispose GPU resources on unmount
  useEffect(() => {
    const mesh = meshRef.current;
    return () => {
      if (mesh) {
        mesh.geometry.dispose();
        if (mesh.material instanceof THREE.Material) {
          mesh.material.dispose();
        }
      }
    };
  }, []);

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[radius, 32, 32]} />
      <shaderMaterial
        vertexShader={FRESNEL_VERT}
        fragmentShader={fresnelFragSource}
        uniforms={uniforms}
        transparent
        blending={THREE.AdditiveBlending}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  );
}
