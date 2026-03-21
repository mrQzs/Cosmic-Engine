import gsap from 'gsap';
import type * as THREE from 'three';

interface LaunchAnimationParams {
  /** The HUD panel DOM element to collapse */
  hudElement: HTMLElement | null;
  /** Target position in world space where the satellite will appear */
  targetPosition: THREE.Vector3;
  /** Callback when the beam reaches the target (satellite condenses) */
  onArrive?: () => void;
  /** Callback when full animation completes */
  onComplete?: () => void;
}

/**
 * Satellite launch animation sequence:
 * 1. HUD panel collapses (scaleY → 0, opacity → 0)
 * 2. Brief pause
 * 3. Satellite condenses at target with elastic bounce
 */
export function playSatelliteLaunch({
  hudElement,
  targetPosition: _targetPosition,
  onArrive,
  onComplete,
}: LaunchAnimationParams): gsap.core.Timeline {
  const tl = gsap.timeline({
    onComplete,
  });

  // Phase 1: HUD collapse
  if (hudElement) {
    tl.to(hudElement, {
      scaleY: 0,
      opacity: 0,
      duration: 0.3,
      ease: 'power2.in',
      transformOrigin: 'bottom center',
    });
  }

  // Phase 2: Brief flash delay
  tl.addLabel('launch', hudElement ? '+=0.1' : 0);

  // Phase 3: Notify arrival (satellite rendering handled by SatelliteSwarm)
  tl.call(() => onArrive?.(), [], 'launch+=0.4');

  // Phase 4: Restore HUD after animation
  if (hudElement) {
    tl.set(hudElement, { scaleY: 1, opacity: 1 }, '+=0.2');
  }

  return tl;
}

/**
 * Particle dissolution animation for failed comment submission.
 * Creates a brief scatter effect at the given position.
 */
export function playParticleDissolve(
  scene: THREE.Scene,
  position: THREE.Vector3,
  onComplete?: () => void,
): gsap.core.Timeline {
  const tl = gsap.timeline({ onComplete });

  // Flash at position
  tl.call(() => {
    // Dissolution is visually handled by SatelliteSwarm removing the pending item
    // A brief camera shake could be added here if desired
    void scene;
    void position;
  });

  tl.to({}, { duration: 0.5 });

  return tl;
}
