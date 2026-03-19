'use client';

import { useCallback, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import gsap from 'gsap';
import { Vector3 } from 'three';
import { useCosmicStore } from '@/stores/cosmicStore';
import { FLY_TO } from '@/config/universeLayout';

/**
 * Hook that provides a `flyTo` function for smooth camera transitions.
 * Uses GSAP for animation. Disables OrbitControls during flight via store.
 */
export function useCameraFlyTo() {
  const { camera } = useThree();
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const setIsTransitioning = useCosmicStore((s) => s.setIsTransitioning);
  const setCameraTarget = useCosmicStore((s) => s.setCameraTarget);
  const setFocusedBody = useCosmicStore((s) => s.setFocusedBody);

  const flyTo = useCallback(
    (
      target: [number, number, number],
      slug?: string,
      options?: { duration?: number; offset?: number },
    ) => {
      // Kill any ongoing animation
      if (timelineRef.current) {
        timelineRef.current.kill();
      }

      const duration = options?.duration ?? FLY_TO.durationSec;
      const offset = options?.offset ?? FLY_TO.focusOffset;

      // Compute a camera position offset from the target
      const dir = camera.position.clone().sub(new Vector3(target[0], target[1], target[2]));
      dir.normalize().multiplyScalar(offset);
      const destination = {
        x: target[0] + dir.x,
        y: target[1] + dir.y,
        z: target[2] + dir.z,
      };

      setIsTransitioning(true);
      setCameraTarget(target);
      if (slug) setFocusedBody(slug);

      const tl = gsap.timeline({
        onComplete: () => {
          setIsTransitioning(false);
        },
      });

      tl.to(camera.position, {
        x: destination.x,
        y: destination.y,
        z: destination.z,
        duration,
        ease: 'power2.inOut',
      });

      timelineRef.current = tl;
    },
    [camera, setIsTransitioning, setCameraTarget, setFocusedBody],
  );

  const cancelFlight = useCallback(() => {
    if (timelineRef.current) {
      timelineRef.current.kill();
      timelineRef.current = null;
      setIsTransitioning(false);
    }
  }, [setIsTransitioning]);

  return { flyTo, cancelFlight };
}
