import * as THREE from 'three';

/**
 * Pre-compile all shaders in the scene to avoid first-use frame stalls.
 * Call during the loading phase (e.g., in CosmicLoader or Canvas onCreated).
 */
export function warmupShaders(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
): void {
  renderer.compile(scene, camera);
}

/**
 * Count the number of compiled shader programs for progress reporting.
 */
export function countShaderPrograms(renderer: THREE.WebGLRenderer): number {
  return renderer.info.programs?.length ?? 0;
}
