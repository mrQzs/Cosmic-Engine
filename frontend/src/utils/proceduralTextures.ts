import * as THREE from 'three';

/**
 * Generate a soft radial cloud texture for dust/nebula particles.
 * Inspired by webgpu-galaxy's cloud sprite approach.
 */
export function createCloudTexture(size = 128): THREE.DataTexture {
  const data = new Uint8Array(size * size * 4);
  const half = size / 2;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (x - half) / half;
      const dy = (y - half) / half;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Soft radial falloff — quadratic for cloud-like appearance
      let alpha = Math.max(0, 1 - dist);
      alpha *= alpha;

      // Organic variation via simple hash noise
      const hash = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
      const noise = (hash - Math.floor(hash)) * 0.15;
      alpha = Math.max(0, Math.min(1, alpha + noise * alpha));

      const idx = (y * size + x) * 4;
      data[idx] = 255;
      data[idx + 1] = 255;
      data[idx + 2] = 255;
      data[idx + 3] = Math.floor(alpha * 255);
    }
  }

  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.needsUpdate = true;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  return texture;
}
