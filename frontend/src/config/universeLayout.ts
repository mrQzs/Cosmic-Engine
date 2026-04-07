/** Galaxy band placement — galaxies are distributed in a ring around the origin */
export const GALAXY_BAND = {
  radiusMin: 100,
  radiusMax: 3000,
  minSpacing: 500,
} as const;

/** Planet orbit range around their parent galaxy center */
export const PLANET_ORBIT = {
  radiusMin: 50,
  radiusMax: 200,
} as const;

/** Level-of-detail distance thresholds */
export const LOD = {
  /** Beyond this distance, galaxies render as sprites */
  galaxyFar: 1200,
  /** Between far and near, render nebula + stars only */
  galaxyMid: 500,
  /** Closer than this, full detail with planets */
  galaxyNear: 500,
  /** Planet becomes a dot beyond this */
  planetFar: 300,
  /** Planet renders atmosphere below this */
  planetNear: 120,
} as const;

/** Camera fly-to animation defaults */
export const FLY_TO = {
  durationSec: 1.5,
  /** Distance offset from target when focused */
  focusOffset: 60,
} as const;

/** Satellite (comment) LOD thresholds */
export const SATELLITE_LOD = {
  /** Beyond this, satellites hidden */
  far: 120,
  /** Within this, full InstancedMesh rendering */
  near: 50,
  /** Cross-fade band as fraction of threshold (±15%) */
  crossFadeBand: 0.15,
  /** Max instances to render */
  maxInstances: 200,
} as const;

/** MiniMap canvas size */
export const MINIMAP = {
  size: 256,
  updateInterval: 5, // frames
} as const;
