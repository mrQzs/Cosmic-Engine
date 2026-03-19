/**
 * Astrophysically-motivated galaxy generation algorithms.
 *
 * References:
 * - Lin & Shu (1964) density wave theory for spiral structure
 * - Sérsic (1963) profile for bulge light distribution
 * - Freeman (1970) exponential disk model
 * - Binney & Tremaine "Galactic Dynamics" for vertical sech² distribution
 */

// ============================================================
// Random number generator (seedable for deterministic galaxies)
// ============================================================

/** Mulberry32 PRNG — deterministic from a 32-bit seed */
export function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Hash a string to a 32-bit integer seed */
export function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return h;
}

// ============================================================
// Sampling distributions
// ============================================================

/** Sample from exponential distribution: P(r) ∝ exp(-r/h) × r dr */
export function sampleExponentialDisk(rand: () => number, scaleLength: number): number {
  // Inverse CDF for r × exp(-r/h): F(r) = 1 - (1 + r/h) × exp(-r/h)
  // Use rejection sampling for simplicity
  const maxR = scaleLength * 6; // 99.7% of mass
  while (true) {
    const r = rand() * maxR;
    const prob = (r / scaleLength) * Math.exp(-r / scaleLength);
    if (rand() < prob / 0.368) return r; // 0.368 ≈ 1/e = max of x*exp(-x)
  }
}

/** Sérsic profile: I(r) = Iₑ × exp(-bₙ × ((r/rₑ)^(1/n) - 1))
 *  For n=4 (de Vaucouleurs): bₙ ≈ 7.669
 *  For n=1 (exponential): bₙ ≈ 1.678
 */
export function sampleSersicBulge(
  rand: () => number,
  effectiveRadius: number,
  sersicN = 4,
): number {
  const bn = 2 * sersicN - 1 / 3 + 4 / (405 * sersicN); // Approximation of bₙ
  const maxR = effectiveRadius * 4;
  while (true) {
    const r = rand() * maxR;
    const prob = Math.exp(-bn * (Math.pow(r / effectiveRadius, 1 / sersicN) - 1));
    if (rand() < prob) return r;
  }
}

/** Vertical distribution: sech²(z / z₀) — self-gravitating isothermal disk */
export function sampleVerticalSech2(rand: () => number, scaleHeight: number): number {
  // Inverse CDF of sech²: z = z₀ × atanh(2u - 1) where u ∈ (0,1)
  const u = rand() * 0.998 + 0.001; // avoid atanh(±1)
  return scaleHeight * Math.atanh(2 * u - 1);
}

// ============================================================
// Spiral arm geometry (logarithmic spiral + density wave)
// ============================================================

/** Logarithmic spiral: r(θ) = a × exp(b × θ)
 *  pitch angle α: tan(α) = 1/b, typical spirals α ≈ 10°-30°
 */
export function logSpiralRadius(theta: number, a: number, b: number): number {
  return a * Math.exp(b * theta);
}

/** Density enhancement from Lin-Shu density wave.
 *  Stars near spiral arm get brightness boost.
 *  @param distFromArm — perpendicular distance from nearest arm centerline
 *  @param armWidth — characteristic arm width
 *  @returns enhancement factor [1, ~3]
 */
export function densityWaveEnhancement(distFromArm: number, armWidth: number): number {
  const gaussian = Math.exp(-(distFromArm * distFromArm) / (2 * armWidth * armWidth));
  return 1 + 2 * gaussian; // Background = 1, on-arm = 3
}

/** Find distance to nearest spiral arm at given (r, θ) */
export function distToNearestArm(
  r: number,
  theta: number,
  numArms: number,
  pitchAngle: number,
  galaxyRadius: number,
): number {
  const b = 1 / Math.tan(pitchAngle);
  let minDist = Infinity;

  for (let arm = 0; arm < numArms; arm++) {
    const armPhase = (arm / numArms) * Math.PI * 2;
    // Solve for θ_arm at radius r: r = a × exp(b × θ_arm)
    // → θ_arm = ln(r/a) / b
    // Use a = galaxyRadius × 0.05 as starting radius
    const a = galaxyRadius * 0.05;
    if (r < a) continue;
    const thetaArm = Math.log(r / a) / b + armPhase;

    // Angular distance (wrapped)
    let dTheta = theta - thetaArm;
    dTheta = ((dTheta + Math.PI) % (Math.PI * 2)) - Math.PI;

    // Convert angular distance to linear at radius r
    const dist = Math.abs(dTheta * r);
    if (dist < minDist) minDist = dist;
  }

  return minDist;
}

// ============================================================
// Hertzsprung-Russell diagram star colors
// ============================================================

export interface StarColor {
  r: number;
  g: number;
  b: number;
}

/** Approximate blackbody color from temperature (K) → RGB
 *  Based on Tanner Helland's algorithm */
export function temperatureToRGB(kelvin: number): StarColor {
  const temp = kelvin / 100;
  let r: number, g: number, b: number;

  // Red
  if (temp <= 66) {
    r = 255;
  } else {
    r = 329.698727446 * Math.pow(temp - 60, -0.1332047592);
    r = Math.max(0, Math.min(255, r));
  }

  // Green
  if (temp <= 66) {
    g = 99.4708025861 * Math.log(temp) - 161.1195681661;
  } else {
    g = 288.1221695283 * Math.pow(temp - 60, -0.0755148492);
  }
  g = Math.max(0, Math.min(255, g));

  // Blue
  if (temp >= 66) {
    b = 255;
  } else if (temp <= 19) {
    b = 0;
  } else {
    b = 138.5177312231 * Math.log(temp - 10) - 305.0447927307;
    b = Math.max(0, Math.min(255, b));
  }

  return { r: r / 255, g: g / 255, b: b / 255 };
}

/** Sample star temperature based on position in galaxy.
 *  Core: older population (K/M stars, 3000-5000K)
 *  Arms: young OB associations (10000-30000K) mixed with general population
 *  Inter-arm: general field population (3000-8000K)
 */
export function sampleStarTemperature(
  rand: () => number,
  r: number,
  galaxyRadius: number,
  onArmFactor: number, // 0-1, how close to spiral arm
): number {
  const rNorm = r / galaxyRadius;

  if (rNorm < 0.15) {
    // Core: old evolved stars (red/yellow)
    return 3000 + rand() * 4000; // 3000-7000K
  }

  // Young blue stars more likely on arms
  if (onArmFactor > 0.5 && rand() < 0.2) {
    return 10000 + rand() * 25000; // O/B type
  }

  // General field: IMF-weighted (more cool stars than hot)
  // Salpeter IMF: N(M) ∝ M^(-2.35) → temperature biased low
  const u = rand();
  if (u < 0.55) return 3000 + rand() * 1500; // M type (red)
  if (u < 0.8) return 4500 + rand() * 1500; // K type (orange)
  if (u < 0.92) return 5500 + rand() * 1000; // G type (yellow, Sun-like)
  if (u < 0.97) return 6500 + rand() * 1500; // F type (yellow-white)
  return 8000 + rand() * 5000; // A/B type (white-blue)
}

// ============================================================
// Uniform random rotation on SO(3) via quaternion
// ============================================================

/** Generate a uniformly random unit quaternion [x, y, z, w]
 *  Using Shoemake's method (1992) */
export function uniformRandomQuaternion(rand: () => number): [number, number, number, number] {
  const u1 = rand();
  const u2 = rand() * Math.PI * 2;
  const u3 = rand() * Math.PI * 2;

  const sq1 = Math.sqrt(1 - u1);
  const sq2 = Math.sqrt(u1);

  return [sq1 * Math.sin(u2), sq1 * Math.cos(u2), sq2 * Math.sin(u3), sq2 * Math.cos(u3)];
}
