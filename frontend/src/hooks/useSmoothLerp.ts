'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import { frameLerp } from '@/utils/mathHelpers';

/**
 * Frame-rate-independent Vector3 lerp hook.
 * Smoothly interpolates a Vector3 toward a target each frame.
 * Returns a ref to the interpolated Vector3.
 */
export function useSmoothLerp(target: Vector3 | [number, number, number], speed = 5) {
  const current = useRef(new Vector3());
  const targetVec = useRef(new Vector3());

  useFrame((_, delta) => {
    if (Array.isArray(target)) {
      targetVec.current.set(target[0], target[1], target[2]);
    } else {
      targetVec.current.copy(target);
    }

    current.current.x = frameLerp(current.current.x, targetVec.current.x, speed, delta);
    current.current.y = frameLerp(current.current.y, targetVec.current.y, speed, delta);
    current.current.z = frameLerp(current.current.z, targetVec.current.z, speed, delta);
  });

  return current;
}
