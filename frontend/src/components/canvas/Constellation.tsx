'use client';

import { useMemo } from 'react';
import * as THREE from 'three';

interface RelatedPlanetPair {
  fromPosition: [number, number, number];
  toPosition: [number, number, number];
  score: number;
  reason?: string;
}

interface ConstellationProps {
  pairs: RelatedPlanetPair[];
}

/**
 * Renders line connections between related planets.
 * Brightness proportional to relation score.
 */
export default function Constellation({ pairs }: ConstellationProps) {
  return (
    <>
      {pairs.map((pair, i) => (
        <ConstellationLine key={i} pair={pair} />
      ))}
    </>
  );
}

function ConstellationLine({ pair }: { pair: RelatedPlanetPair }) {
  const lineObject = useMemo(() => {
    const points = [new THREE.Vector3(...pair.fromPosition), new THREE.Vector3(...pair.toPosition)];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: '#38bdf8',
      transparent: true,
      opacity: 0.05 + pair.score * 0.2,
      depthWrite: false,
    });
    return new THREE.Line(geometry, material);
  }, [pair.fromPosition, pair.toPosition, pair.score]);

  return <primitive object={lineObject} />;
}
