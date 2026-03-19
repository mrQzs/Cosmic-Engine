import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * Merge multiple orbit ring geometries into a single BufferGeometry.
 * Reduces draw calls for static orbit paths.
 */
export function mergeOrbitRings(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry | null {
  if (geometries.length === 0) return null;
  return mergeGeometries(geometries, false);
}

/**
 * Merge constellation line geometries into a single BufferGeometry.
 * Reduces draw calls for static relationship lines.
 */
export function mergeConstellationLines(
  geometries: THREE.BufferGeometry[],
): THREE.BufferGeometry | null {
  if (geometries.length === 0) return null;
  return mergeGeometries(geometries, false);
}
