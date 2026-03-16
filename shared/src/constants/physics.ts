/** Starfield configuration */
export const STARFIELD = {
  count: 6000,
  radiusMin: 800,
  radiusMax: 2000,
} as const;

/** Camera defaults */
export const CAMERA = {
  fov: 60,
  near: 0.1,
  far: 5000,
  dprMax: 1.5,
} as const;

/** Adaptive quality thresholds */
export const QUALITY = {
  downgradeThresholdFps: 30,
  downgradeAfterSeconds: 3,
  upgradeThresholdFps: 55,
  upgradeAfterSeconds: 10,
} as const;
