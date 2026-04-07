/**
 * Generic object pool to avoid GC pressure from frequent allocations.
 * Used for particles, trails, and other transient objects.
 */
export class ObjectPool<T> {
  private _pool: T[] = [];
  private _activeCount = 0;

  constructor(
    private readonly _factory: () => T,
    private readonly _reset: (item: T) => void,
    initialSize = 0,
  ) {
    this.prewarm(initialSize);
  }

  /** Take an item from the pool, or create a new one if empty. */
  acquire(): T {
    this._activeCount++;
    if (this._pool.length > 0) {
      return this._pool.pop()!;
    }
    return this._factory();
  }

  /** Return an item to the pool after resetting it. */
  release(item: T): void {
    this._activeCount = Math.max(0, this._activeCount - 1);
    this._reset(item);
    this._pool.push(item);
  }

  /** Pre-populate the pool with idle items. */
  prewarm(count: number): void {
    for (let i = 0; i < count; i++) {
      const item = this._factory();
      this._reset(item);
      this._pool.push(item);
    }
  }

  /** Destroy all pooled items. */
  dispose(cleanup?: (item: T) => void): void {
    if (cleanup) {
      for (const item of this._pool) cleanup(item);
    }
    this._pool.length = 0;
    this._activeCount = 0;
  }

  get availableCount(): number {
    return this._pool.length;
  }

  get activeCount(): number {
    return this._activeCount;
  }
}
