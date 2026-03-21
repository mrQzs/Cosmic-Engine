import gsap from 'gsap';
import * as THREE from 'three';

interface CollapseParams {
  /** Positions of the selected asteroids in world space */
  asteroidPositions: THREE.Vector3[];
  /** Callback when collision flash happens (spawn planet here) */
  onCollision?: (centroid: THREE.Vector3) => void;
  /** Callback when full animation completes */
  onComplete?: () => void;
}

/**
 * Gravitational collapse animation:
 * Phase 1 (0-1.5s): Asteroids accelerate toward centroid
 * Phase 2 (1.5-2.0s): Collision flash + camera shake
 * Phase 3 (2.0-3.0s): Flash fades, new planet appears with scale bounce
 */
export function playGravitationalCollapse({
  asteroidPositions,
  onCollision,
  onComplete,
}: CollapseParams): gsap.core.Timeline {
  if (asteroidPositions.length === 0) {
    onComplete?.();
    return gsap.timeline();
  }

  // Compute centroid
  const centroid = new THREE.Vector3();
  for (const pos of asteroidPositions) {
    centroid.add(pos);
  }
  centroid.divideScalar(asteroidPositions.length);

  const tl = gsap.timeline({ onComplete });

  // Phase 1: Attraction — animate each position toward centroid
  const positionObjects = asteroidPositions.map((p) => ({
    x: p.x,
    y: p.y,
    z: p.z,
  }));

  for (let i = 0; i < positionObjects.length; i++) {
    tl.to(
      positionObjects[i],
      {
        x: centroid.x,
        y: centroid.y,
        z: centroid.z,
        duration: 1.5,
        ease: 'power2.in',
        onUpdate: () => {
          asteroidPositions[i].set(
            positionObjects[i].x,
            positionObjects[i].y,
            positionObjects[i].z,
          );
        },
      },
      0, // All start at the same time, with slight stagger
    );
  }

  // Phase 2: Collision flash
  tl.addLabel('collision', 1.5);
  tl.call(
    () => {
      onCollision?.(centroid.clone());
    },
    [],
    'collision',
  );

  // Phase 3: Allow time for planet birth animation
  tl.to({}, { duration: 1.0 }, 'collision+=0.5');

  return tl;
}
