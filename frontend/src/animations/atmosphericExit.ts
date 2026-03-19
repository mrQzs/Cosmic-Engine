import gsap from 'gsap';
import type { Camera } from 'three';

interface AtmosphericExitOptions {
  camera: Camera;
  returnPosition: [number, number, number];
  onPhaseChange?: (phase: 'liftoff' | 'escape' | 'complete') => void;
  onComplete?: () => void;
}

/**
 * Reverse atmospheric animation — returns camera to orbit.
 * Phase 1 (0-0.8s): Liftoff, FOV widens
 * Phase 2 (0.8-1.5s): Escape to orbit position, FOV normalizes to 60
 */
export function createAtmosphericExit({
  camera,
  returnPosition,
  onPhaseChange,
  onComplete,
}: AtmosphericExitOptions): gsap.core.Timeline {
  const perspCamera = camera as Camera & { fov: number; updateProjectionMatrix: () => void };

  const tl = gsap.timeline({
    onComplete: () => {
      onPhaseChange?.('complete');
      onComplete?.();
    },
  });

  // Phase 1: Liftoff
  tl.call(() => onPhaseChange?.('liftoff'), [], 0);
  tl.to(
    camera.position,
    {
      y: camera.position.y + 20,
      z: camera.position.z + 30,
      duration: 0.8,
      ease: 'power2.in',
    },
    0,
  );
  tl.to(
    perspCamera,
    {
      fov: 70,
      duration: 0.8,
      ease: 'power2.in',
      onUpdate: () => perspCamera.updateProjectionMatrix?.(),
    },
    0,
  );

  // Phase 2: Escape to orbit
  tl.call(() => onPhaseChange?.('escape'), [], 0.8);
  tl.to(
    camera.position,
    {
      x: returnPosition[0],
      y: returnPosition[1],
      z: returnPosition[2],
      duration: 0.7,
      ease: 'power2.out',
    },
    0.8,
  );
  tl.to(
    perspCamera,
    {
      fov: 60,
      duration: 0.7,
      ease: 'power1.out',
      onUpdate: () => perspCamera.updateProjectionMatrix?.(),
    },
    0.8,
  );

  return tl;
}
