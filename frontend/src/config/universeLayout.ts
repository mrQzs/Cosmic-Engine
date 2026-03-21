/** Galaxy band placement — galaxies are distributed in a ring around the origin */
export const GALAXY_BAND = {
  radiusMin: 50,
  radiusMax: 2000,
  minSpacing: 300,
} as const;

/** Planet orbit range around their parent galaxy center */
export const PLANET_ORBIT = {
  radiusMin: 20,
  radiusMax: 100,
} as const;

/** Level-of-detail distance thresholds */
export const LOD = {
  /** Beyond this distance, galaxies render as sprites */
  galaxyFar: 800,
  /** Between far and near, render nebula + stars only */
  galaxyMid: 300,
  /** Closer than this, full detail with planets */
  galaxyNear: 300,
  /** Planet becomes a dot beyond this */
  planetFar: 200,
  /** Planet renders atmosphere below this */
  planetNear: 80,
} as const;

/** Camera fly-to animation defaults */
export const FLY_TO = {
  durationSec: 1.5,
  /** Distance offset from target when focused */
  focusOffset: 40,
} as const;

/** Satellite (comment) LOD thresholds */
export const SATELLITE_LOD = {
  /** Beyond this, satellites hidden */
  far: 60,
  /** Within this, full InstancedMesh rendering */
  near: 25,
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
