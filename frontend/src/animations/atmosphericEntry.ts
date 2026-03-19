import gsap from 'gsap';
import type { Camera } from 'three';

interface AtmosphericEntryOptions {
  camera: Camera;
  targetPosition: [number, number, number];
  onPhaseChange?: (phase: 'accelerate' | 'pierce' | 'decelerate' | 'complete') => void;
  onComplete?: () => void;
}

/**
 * Atmospheric entry animation — 3 phases:
 * Phase 1 (0-1s): Accelerate toward planet, FOV widens 60→45
 * Phase 2 (1-1.5s): Cloud pierce with glitch effect, FOV snap 45→55
 * Phase 3 (1.5-2s): Decelerate to landing, FOV settles 55→50
 */
export function createAtmosphericEntry({
  camera,
  targetPosition,
  onPhaseChange,
  onComplete,
}: AtmosphericEntryOptions): gsap.core.Timeline {
  const perspCamera = camera as Camera & { fov: number; updateProjectionMatrix: () => void };

  const tl = gsap.timeline({
    onComplete: () => {
      onPhaseChange?.('complete');
      onComplete?.();
    },
  });

  // Phase 1: Accelerate
  tl.call(() => onPhaseChange?.('accelerate'), [], 0);
  tl.to(
    camera.position,
    {
      x: targetPosition[0],
      y: targetPosition[1],
      z: targetPosition[2] + 15,
      duration: 1,
      ease: 'power2.in',
    },
    0,
  );
  tl.to(
    perspCamera,
    {
      fov: 45,
      duration: 1,
      ease: 'power2.in',
      onUpdate: () => perspCamera.updateProjectionMatrix?.(),
    },
    0,
  );

  // Phase 2: Cloud pierce + glitch
  tl.call(() => onPhaseChange?.('pierce'), [], 1);
  tl.to(
    camera.position,
    {
      z: targetPosition[2] + 8,
      duration: 0.5,
      ease: 'power3.inOut',
    },
    1,
  );
  tl.to(
    perspCamera,
    {
      fov: 55,
      duration: 0.5,
      ease: 'power1.out',
      onUpdate: () => perspCamera.updateProjectionMatrix?.(),
    },
    1,
  );

  // Phase 3: Decelerate
  tl.call(() => onPhaseChange?.('decelerate'), [], 1.5);
  tl.to(
    camera.position,
    {
      z: targetPosition[2] + 5,
      duration: 0.5,
      ease: 'power2.out',
    },
    1.5,
  );
  tl.to(
    perspCamera,
    {
      fov: 50,
      duration: 0.5,
      ease: 'power1.inOut',
      onUpdate: () => perspCamera.updateProjectionMatrix?.(),
    },
    1.5,
  );

  return tl;
}
