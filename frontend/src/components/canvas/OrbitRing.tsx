'use client';

import { useMemo, useRef } from 'react';
import * as THREE from 'three';

interface OrbitRingProps {
  semiMajorAxis: number;
  eccentricity: number;
  inclination: number;
  centerOffset: [number, number, number];
  segments?: number;
}

export default function OrbitRing({
  semiMajorAxis: a,
  eccentricity: e,
  inclination,
  centerOffset,
  segments = 128,
}: OrbitRingProps) {
  const ref = useRef<THREE.Line>(null);

  const lineObject = useMemo(() => {
    const b = a * Math.sqrt(1 - e * e);
    const points: THREE.Vector3[] = [];

    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      const x = a * Math.cos(theta) - a * e;
      const y = b * Math.sin(theta);

      const cosI = Math.cos(inclination);
      const sinI = Math.sin(inclination);
      const ry = y * sinI;
      const rz = y * cosI;

      points.push(
        new THREE.Vector3(centerOffset[0] + x, centerOffset[1] + ry, centerOffset[2] + rz),
      );
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: '#e2e8f0',
      transparent: true,
      opacity: 0.15,
    });

    return new THREE.Line(geometry, material);
  }, [a, e, inclination, centerOffset, segments]);

  return <primitive ref={ref} object={lineObject} />;
}
