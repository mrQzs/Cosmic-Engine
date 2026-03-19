import { MathUtils } from 'three';

/**
 * Frame-rate-independent lerp.
 * Smoothly interpolates toward `target` using exponential decay.
 * @param current - current value
 * @param target - target value
 * @param speed - convergence speed (higher = faster, typically 2-10)
 * @param delta - frame delta time in seconds
 */
export function frameLerp(current: number, target: number, speed: number, delta: number): number {
  if (delta <= 0) return current;
  const t = 1 - Math.exp(-speed * delta);
  return MathUtils.lerp(current, target, t);
}

/**
 * Frame-rate-independent slerp factor.
 * Returns the interpolation factor `t` for use with Quaternion.slerp.
 * @param speed - convergence speed
 * @param delta - frame delta time in seconds
 */
export function frameSlerp(speed: number, delta: number): number {
  if (delta <= 0) return 0;
  return 1 - Math.exp(-speed * delta);
}

/**
 * Solve Kepler's equation M = E - e*sin(E) for eccentric anomaly E
 * using Newton-Raphson iteration.
 * @param M - mean anomaly (radians)
 * @param e - eccentricity [0, 1)
 * @param maxIter - maximum iterations (default 6)
 * @returns eccentric anomaly E (radians)
 */
export function newtonRaphsonKepler(M: number, e: number, maxIter = 6): number {
  // Normalize M to [0, 2π]
  let m = M % (2 * Math.PI);
  if (m < 0) m += 2 * Math.PI;

  // Initial guess: E₀ = M + e*sin(M) for faster convergence
  let E = m + e * Math.sin(m);

  for (let i = 0; i < maxIter; i++) {
    const dE = (E - e * Math.sin(E) - m) / (1 - e * Math.cos(E));
    E -= dE;
    if (Math.abs(dE) < 1e-10) break;
  }

  return E;
}

/**
 * Compute 2D position on a Kepler ellipse given eccentric anomaly.
 * Returns [x, y] in the orbital plane.
 * @param a - semi-major axis
 * @param e - eccentricity
 * @param E - eccentric anomaly (radians)
 */
export function keplerPosition(a: number, e: number, E: number): [number, number] {
  const b = a * Math.sqrt(1 - e * e);
  const x = a * (Math.cos(E) - e);
  const y = b * Math.sin(E);
  return [x, y];
}

/**
 * Approximate orbital speed factor based on distance from focus.
 * Faster near periapsis, slower near apoapsis (Kepler's second law).
 * @param r - current distance from focus
 * @param a - semi-major axis
 */
export function keplerSpeed(r: number, a: number): number {
  // v ∝ sqrt(2/r - 1/a), simplified to relative factor
  return Math.sqrt((2 / r - 1 / a) * a);
}
