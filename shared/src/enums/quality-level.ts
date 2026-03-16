/** Adaptive rendering quality tiers */
export enum QualityLevel {
  /** Full 3D scene with all effects */
  High = 'high',
  /** Reduced particles and simpler shaders */
  Medium = 'medium',
  /** Minimal particles, no post-processing */
  Low = 'low',
  /** 2D fallback, no WebGL */
  UltraLow = 'ultra-low',
}
