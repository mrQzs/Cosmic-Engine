'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Quaternion } from 'three';
import { frameSlerp } from '@/utils/mathHelpers';

/**
 * Frame-rate-independent Quaternion slerp hook.
 * Smoothly interpolates a Quaternion toward a target each frame.
 * Returns a ref to the interpolated Quaternion.
 */
export function useSmoothSlerp(target: Quaternion, speed = 5) {
  const current = useRef(new Quaternion());

  useFrame((_, delta) => {
    const t = frameSlerp(speed, delta);
    current.current.slerp(target, t);
  });

  return current;
}
