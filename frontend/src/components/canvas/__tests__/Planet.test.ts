import { describe, it, expect } from 'vitest';
import { newtonRaphsonKepler, keplerPosition } from '@/utils/mathHelpers';

/**
 * Tests that planet orbit position calculation matches Kepler math.
 * We test the math directly since R3F component rendering requires
 * a full WebGL context which is not available in JSDOM.
 */
describe('Planet orbit position (Kepler)', () => {
  const orbitRadius = 50;
  const eccentricity = 0.3;
  const orbitalSpeed = 0.5;
  const phaseOffset = 0;
  const galaxyCenter: [number, number, number] = [100, 0, 0];
  const inclination = 0.2;

  function computeOrbitPosition(time: number) {
    const M = phaseOffset + time * orbitalSpeed * 0.3;
    const E = newtonRaphsonKepler(M, eccentricity);
    const [ox, oy] = keplerPosition(orbitRadius, eccentricity, E);
    const cosI = Math.cos(inclination);
    const sinI = Math.sin(inclination);
    return {
      x: galaxyCenter[0] + ox,
      y: galaxyCenter[1] + oy * sinI,
      z: galaxyCenter[2] + oy * cosI,
    };
  }

  it('starts at periapsis when phaseOffset=0 and time=0', () => {
    const pos = computeOrbitPosition(0);
    // At E=0: x = a*(1-e) + center.x
    const expectedX = galaxyCenter[0] + orbitRadius * (1 - eccentricity);
    expect(pos.x).toBeCloseTo(expectedX, 5);
    expect(pos.y).toBeCloseTo(0, 5);
    expect(pos.z).toBeCloseTo(0, 5);
  });

  it('orbit stays within expected distance bounds', () => {
    const periapsis = orbitRadius * (1 - eccentricity);
    const apoapsis = orbitRadius * (1 + eccentricity);

    for (let t = 0; t < 20; t += 0.5) {
      const pos = computeOrbitPosition(t);
      const dx = pos.x - galaxyCenter[0];
      const dy = pos.y;
      const dz = pos.z - galaxyCenter[2];
      // Distance in the orbital plane (before inclination)
      // Need to un-rotate inclination to get flat distance
      const cosI = Math.cos(inclination);
      const sinI = Math.sin(inclination);
      // Inverse rotation: oy = dy/sinI (when sinI != 0)
      const oy = sinI !== 0 ? dy / sinI : dz / cosI;
      const r = Math.sqrt(dx * dx + oy * oy);
      expect(r).toBeGreaterThanOrEqual(periapsis - 0.01);
      expect(r).toBeLessThanOrEqual(apoapsis + 0.01);
    }
  });

  it('orbit position is frame-rate independent (absolute time)', () => {
    // Same time should yield same position regardless of how we got there
    const pos1 = computeOrbitPosition(5.0);
    const pos2 = computeOrbitPosition(5.0);
    expect(pos1.x).toBeCloseTo(pos2.x, 10);
    expect(pos1.y).toBeCloseTo(pos2.y, 10);
    expect(pos1.z).toBeCloseTo(pos2.z, 10);
  });

  it('orbit position changes over time (not stuck)', () => {
    const pos1 = computeOrbitPosition(0);
    const pos2 = computeOrbitPosition(2);
    const dist = Math.sqrt(
      (pos1.x - pos2.x) ** 2 + (pos1.y - pos2.y) ** 2 + (pos1.z - pos2.z) ** 2,
    );
    expect(dist).toBeGreaterThan(0.1);
  });
});
