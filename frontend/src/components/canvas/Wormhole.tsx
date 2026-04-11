'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { WormholeData } from '@/hooks/useUniverseData';

interface WormholeProps {
  data: WormholeData;
  onClick?: (year: number) => void;
}

const VORTEX_VERT = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const VORTEX_FRAG = `
varying vec2 vUv;
uniform float u_time;
uniform vec3 u_color;

void main() {
  vec2 uv = vUv - 0.5;
  float dist = length(uv);
  float angle = atan(uv.y, uv.x);
  float spiral = sin(angle * 5.0 + dist * 20.0 - u_time * 3.0) * 0.5 + 0.5;
  float glow = smoothstep(0.5, 0.0, dist);
  float alpha = glow * (0.3 + 0.7 * spiral) * smoothstep(0.5, 0.1, dist);
  vec3 color = u_color * (1.0 + spiral * 0.5);
  gl_FragColor = vec4(color, alpha);
}
`;

export default function Wormhole({ data, onClick }: WormholeProps) {
  const ringRef = useRef<THREE.Group>(null);

  const color = useMemo(() => new THREE.Color(data.color), [data.color]);

  const uniforms = useMemo(
    () => ({
      u_time: { value: 0 },
      u_color: { value: color },
    }),
    [color],
  );

  useFrame(({ clock }) => {
    if (!ringRef.current) return;
    ringRef.current.rotation.z = clock.elapsedTime * 0.3;
    uniforms.u_time.value = clock.elapsedTime;
  });

  return (
    <group
      position={[data.position.x, data.position.y, data.position.z]}
      onClick={() => onClick?.(data.year)}
    >
      <group ref={ringRef}>
        <mesh>
          <torusGeometry args={[12, 1.5, 16, 48]} />
          <meshStandardMaterial
            color={data.color}
            emissive={data.color}
            emissiveIntensity={0.5}
            roughness={0.3}
            metalness={0.8}
          />
        </mesh>
      </group>

      <mesh>
        <circleGeometry args={[11, 48]} />
        <shaderMaterial
          vertexShader={VORTEX_VERT}
          fragmentShader={VORTEX_FRAG}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      <pointLight color={data.color} intensity={2} distance={60} />
    </group>
  );
}
