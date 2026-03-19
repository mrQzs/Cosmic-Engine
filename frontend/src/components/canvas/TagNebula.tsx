'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useFilterStore } from '@/stores/filterStore';

interface TagData {
  name: string;
  slug: string;
  color: string;
  postCount: number;
}

interface TagNebulaProps {
  tags: TagData[];
  centerPosition?: [number, number, number];
}

const PARTICLES_PER_TAG = 30;

export default function TagNebula({ tags, centerPosition = [0, 100, 0] }: TagNebulaProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const _setActiveTag = useFilterStore((s) => s.setActiveTag);

  const { positions, colors, sizes } = useMemo(() => {
    const totalParticles = tags.length * PARTICLES_PER_TAG;
    const positions = new Float32Array(totalParticles * 3);
    const colors = new Float32Array(totalParticles * 3);
    const sizes = new Float32Array(totalParticles);
    // Tag bounds could be used for click detection in future

    tags.forEach((tag, ti) => {
      // Distribute tag clusters in a ring
      const angle = (ti / tags.length) * Math.PI * 2;
      const dist = 30 + tags.length * 5;
      const cx = centerPosition[0] + Math.cos(angle) * dist;
      const cy = centerPosition[1];
      const cz = centerPosition[2] + Math.sin(angle) * dist;
      const clusterRadius = 5 + tag.postCount * 0.5;

      const color = new THREE.Color(tag.color);

      for (let i = 0; i < PARTICLES_PER_TAG; i++) {
        const idx = ti * PARTICLES_PER_TAG + i;
        // Sphere distribution within cluster
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = Math.random() * clusterRadius;
        positions[idx * 3] = cx + r * Math.sin(phi) * Math.cos(theta);
        positions[idx * 3 + 1] = cy + r * Math.sin(phi) * Math.sin(theta);
        positions[idx * 3 + 2] = cz + r * Math.cos(phi);

        colors[idx * 3] = color.r;
        colors[idx * 3 + 1] = color.g;
        colors[idx * 3 + 2] = color.b;

        // Size proportional to postCount
        sizes[idx] = 1 + (tag.postCount / 10) * 2;
      }
    });

    return { positions, colors, sizes };
  }, [tags, centerPosition]);

  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.01;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
      </bufferGeometry>
      <pointsMaterial
        size={2}
        sizeAttenuation
        transparent
        opacity={0.6}
        vertexColors
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
