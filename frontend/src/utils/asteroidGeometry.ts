import * as THREE from 'three';

/**
 * Seeded PRNG (mulberry32) for deterministic geometry deformation.
 */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Create a deformed IcosahedronGeometry to simulate an irregular asteroid.
 * @param seed - deterministic seed for vertex displacement
 * @param roughness - 0 (smooth, sphere-like) to 1 (very rough, angular)
 * @param detail - icosahedron subdivision level (0=20 faces, 1=80 faces)
 * @returns A new BufferGeometry with displaced vertices
 */
export function createAsteroidGeometry(
  seed: number,
  roughness: number,
  detail: number = 1,
): THREE.BufferGeometry {
  const geo = new THREE.IcosahedronGeometry(1, detail);
  const positions = geo.attributes.position;
  const rng = mulberry32(seed);

  const displacement = roughness * 0.4; // Max 40% vertex offset at full roughness

  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const y = positions.getY(i);
    const z = positions.getZ(i);

    // Normalize to unit sphere, then apply random radial displacement
    const len = Math.sqrt(x * x + y * y + z * z) || 1;
    const scale = 1 + (rng() - 0.5) * 2 * displacement;

    positions.setXYZ(i, (x / len) * scale, (y / len) * scale, (z / len) * scale);
  }

  geo.computeVertexNormals();
  return geo;
}

/**
 * Pre-generate a set of asteroid geometry variants for InstancedMesh.
 * Returns 3 geometries: rough, medium, smooth.
 */
export function createAsteroidVariants(baseSeed: number = 42): THREE.BufferGeometry[] {
  return [
    createAsteroidGeometry(baseSeed, 0.9, 1), // Rough
    createAsteroidGeometry(baseSeed + 100, 0.5, 1), // Medium
    createAsteroidGeometry(baseSeed + 200, 0.15, 1), // Smooth
  ];
}
