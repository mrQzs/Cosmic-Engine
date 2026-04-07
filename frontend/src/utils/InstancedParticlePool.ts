import * as THREE from 'three';

/**
 * Particle pool backed by InstancedMesh.
 * Hidden particles use zero-scale matrices instead of create/destroy.
 */
export class InstancedParticlePool {
  private readonly _mesh: THREE.InstancedMesh;
  private readonly _freeIndices: number[] = [];
  private readonly _dummy = new THREE.Object3D();
  private readonly _zeroMatrix = new THREE.Matrix4().makeScale(0, 0, 0);

  constructor(geometry: THREE.BufferGeometry, material: THREE.Material, maxCount: number) {
    this._mesh = new THREE.InstancedMesh(geometry, material, maxCount);
    this._mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    // Initialize all instances as hidden (zero scale) and push indices to free list
    for (let i = maxCount - 1; i >= 0; i--) {
      this._mesh.setMatrixAt(i, this._zeroMatrix);
      this._freeIndices.push(i);
    }
    this._mesh.instanceMatrix.needsUpdate = true;
  }

  /** Acquire a particle index. Returns -1 if pool is exhausted. */
  acquire(): number {
    if (this._freeIndices.length === 0) return -1;
    return this._freeIndices.pop()!;
  }

  /** Release a particle back to the pool (hide via zero-scale). */
  release(index: number): void {
    this._mesh.setMatrixAt(index, this._zeroMatrix);
    this._mesh.instanceMatrix.needsUpdate = true;
    this._freeIndices.push(index);
  }

  /** Update the transform of a specific particle. */
  setTransform(
    index: number,
    position: THREE.Vector3,
    quaternion: THREE.Quaternion,
    scale: THREE.Vector3,
  ): void {
    this._dummy.position.copy(position);
    this._dummy.quaternion.copy(quaternion);
    this._dummy.scale.copy(scale);
    this._dummy.updateMatrix();
    this._mesh.setMatrixAt(index, this._dummy.matrix);
    this._mesh.instanceMatrix.needsUpdate = true;
  }

  /** Set color of a specific particle. */
  setColor(index: number, color: THREE.Color): void {
    this._mesh.setColorAt(index, color);
    if (this._mesh.instanceColor) {
      this._mesh.instanceColor.needsUpdate = true;
    }
  }

  /** The underlying InstancedMesh to add to the scene. */
  get mesh(): THREE.InstancedMesh {
    return this._mesh;
  }

  get freeCount(): number {
    return this._freeIndices.length;
  }

  /** Dispose all GPU resources. */
  dispose(): void {
    this._mesh.geometry.dispose();
    if (Array.isArray(this._mesh.material)) {
      this._mesh.material.forEach((m) => m.dispose());
    } else {
      this._mesh.material.dispose();
    }
    this._mesh.dispose();
  }
}
