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
  dprMax: 2,
} as const;

/** Blackbody radiation color LUT — 11 stops from 1000K to 40000K.
 *  CIE 1931 2° standard observer + Planck's law, saturation boosted for visual clarity.
 *  Used in GLSL via piecewise smoothstep interpolation. */
export const BLACKBODY_LUT = [
  { tempK: 1000, rgb: [1.0, 0.03, 0.0] },
  { tempK: 2000, rgb: [1.0, 0.18, 0.0] },
  { tempK: 3000, rgb: [1.0, 0.36, 0.06] },
  { tempK: 4000, rgb: [1.0, 0.55, 0.18] },
  { tempK: 5000, rgb: [1.0, 0.7, 0.3] },
  { tempK: 5800, rgb: [1.0, 0.78, 0.45] },
  { tempK: 6500, rgb: [1.0, 0.88, 0.68] },
  { tempK: 8000, rgb: [0.75, 0.82, 1.0] },
  { tempK: 10000, rgb: [0.58, 0.68, 1.0] },
  { tempK: 15000, rgb: [0.45, 0.55, 1.0] },
  { tempK: 40000, rgb: [0.35, 0.46, 1.0] },
] as const;

/** Star preset parameters keyed by lifecycle phase */
export interface StarPresetParams {
  /* --- Temperature --- */
  baseTemperature: number;
  temperatureRange: number;
  /* --- Geometry scale (relative to base unit) --- */
  starScale: number;
  /* --- Granulation (convection cells) --- */
  granulationScale: number;
  flowSpeed: number;
  displacement: number;
  /* --- Sunspot magnetic model --- */
  spotScale: number;
  spotUmbraThreshold: number;
  spotPenumbraThreshold: number;
  spotUmbraDropK: number;
  spotPenumbraDropK: number;
  /* --- Limb darkening --- */
  limbDarkeningStrength: number;
  /* --- Pulsation --- */
  pulseSpeed: number;
  pulseAmount: number;
  /* --- Rim highlight --- */
  rimPower: number;
  rimBoost: number;
  /* --- Halo shell --- */
  haloScale: number;
  haloOpacity: number;
  /* --- Corona particles --- */
  coronaParticleCount: number;
  particleShell: number;
  particleAmplitude: number;
  particleSpeed: number;
  particleSize: number;
  particleIntensity: number;
  /* --- Prominence arcs --- */
  prominenceCount: number;
  prominenceIntensity: number;
  prominenceSpeed: number;
  prominenceTemp: number;
}

export const STAR_PRESETS: Record<string, StarPresetParams> = {
  /** Protostar — dim, turbulent, still accreting */
  PROTOSTAR: {
    baseTemperature: 2800,
    temperatureRange: 500,
    starScale: 3,
    granulationScale: 60.0,
    flowSpeed: 0.1,
    displacement: 0.022,
    spotScale: 5.0,
    spotUmbraThreshold: 0.7,
    spotPenumbraThreshold: 0.5,
    spotUmbraDropK: 500,
    spotPenumbraDropK: 200,
    limbDarkeningStrength: 0.7,
    pulseSpeed: 0.6,
    pulseAmount: 0.04,
    rimPower: 2.0,
    rimBoost: 0.4,
    haloScale: 1.12,
    haloOpacity: 0.22,
    coronaParticleCount: 40,
    particleShell: 1.65,
    particleAmplitude: 0.4,
    particleSpeed: 0.85,
    particleSize: 0.06,
    particleIntensity: 0.7,
    prominenceCount: 0,
    prominenceIntensity: 0,
    prominenceSpeed: 0,
    prominenceTemp: 0,
  },
  /** Main Sequence — Sun-like (G2V, 5778K) */
  MAIN_SEQUENCE: {
    baseTemperature: 5778,
    temperatureRange: 1000,
    starScale: 4,
    granulationScale: 48.0,
    flowSpeed: 0.06,
    displacement: 0.012,
    spotScale: 3.2,
    spotUmbraThreshold: 0.85,
    spotPenumbraThreshold: 0.65,
    spotUmbraDropK: 800,
    spotPenumbraDropK: 300,
    limbDarkeningStrength: 0.85,
    pulseSpeed: 0.35,
    pulseAmount: 0.02,
    rimPower: 2.8,
    rimBoost: 0.62,
    haloScale: 1.1,
    haloOpacity: 0.2,
    coronaParticleCount: 80,
    particleShell: 1.86,
    particleAmplitude: 0.46,
    particleSpeed: 0.52,
    particleSize: 0.05,
    particleIntensity: 0.9,
    prominenceCount: 3,
    prominenceIntensity: 0.7,
    prominenceSpeed: 0.5,
    prominenceTemp: 8000,
  },
  /** Giant — expanded, cooler, orange (K2V-like, 4600K) */
  GIANT: {
    baseTemperature: 4600,
    temperatureRange: 700,
    starScale: 6,
    granulationScale: 42.0,
    flowSpeed: 0.05,
    displacement: 0.014,
    spotScale: 2.9,
    spotUmbraThreshold: 0.85,
    spotPenumbraThreshold: 0.65,
    spotUmbraDropK: 700,
    spotPenumbraDropK: 280,
    limbDarkeningStrength: 0.8,
    pulseSpeed: 0.3,
    pulseAmount: 0.022,
    rimPower: 3.2,
    rimBoost: 0.56,
    haloScale: 1.1,
    haloOpacity: 0.18,
    coronaParticleCount: 100,
    particleShell: 1.76,
    particleAmplitude: 0.32,
    particleSpeed: 0.48,
    particleSize: 0.05,
    particleIntensity: 0.85,
    prominenceCount: 3,
    prominenceIntensity: 0.65,
    prominenceSpeed: 0.4,
    prominenceTemp: 7500,
  },
  /** Red Giant — large, deep red, very active (M-type, 3200K) */
  RED_GIANT: {
    baseTemperature: 3200,
    temperatureRange: 600,
    starScale: 8,
    granulationScale: 56.0,
    flowSpeed: 0.08,
    displacement: 0.018,
    spotScale: 4.8,
    spotUmbraThreshold: 0.75,
    spotPenumbraThreshold: 0.52,
    spotUmbraDropK: 600,
    spotPenumbraDropK: 250,
    limbDarkeningStrength: 0.75,
    pulseSpeed: 0.5,
    pulseAmount: 0.035,
    rimPower: 2.1,
    rimBoost: 0.48,
    haloScale: 1.08,
    haloOpacity: 0.18,
    coronaParticleCount: 120,
    particleShell: 1.72,
    particleAmplitude: 0.4,
    particleSpeed: 0.74,
    particleSize: 0.06,
    particleIntensity: 1.0,
    prominenceCount: 3,
    prominenceIntensity: 0.9,
    prominenceSpeed: 0.8,
    prominenceTemp: 6000,
  },
} as const;

/** Per-quality-tier DPR ranges */
export const QUALITY_DPR = {
  high: { min: 1, max: 2 },
  medium: { min: 1, max: 1.5 },
  low: { min: 0.75, max: 1 },
  'ultra-low': { min: 0.5, max: 0.75 },
} as const;

/** Adaptive quality thresholds */
export const QUALITY = {
  downgradeThresholdFps: 30,
  downgradeAfterSeconds: 3,
  upgradeThresholdFps: 55,
  upgradeAfterSeconds: 10,
} as const;
