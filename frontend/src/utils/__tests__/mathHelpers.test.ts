import { describe, it, expect } from 'vitest';
import {
  frameLerp,
  frameSlerp,
  newtonRaphsonKepler,
  keplerPosition,
  keplerSpeed,
} from '../mathHelpers';

describe('frameLerp', () => {
  it('returns current when delta is 0', () => {
    expect(frameLerp(5, 10, 5, 0)).toBe(5);
  });

  it('approaches target with positive delta', () => {
    const result = frameLerp(0, 10, 5, 0.016);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(10);
  });

  it('converges closer with larger delta', () => {
    const small = frameLerp(0, 10, 5, 0.016);
    const large = frameLerp(0, 10, 5, 0.1);
    expect(large).toBeGreaterThan(small);
  });

  it('converges closer with larger speed', () => {
    const slow = frameLerp(0, 10, 2, 0.016);
    const fast = frameLerp(0, 10, 10, 0.016);
    expect(fast).toBeGreaterThan(slow);
  });

  it('handles negative direction', () => {
    const result = frameLerp(10, 0, 5, 0.016);
    expect(result).toBeLessThan(10);
    expect(result).toBeGreaterThan(0);
  });

  it('returns current for negative delta', () => {
    expect(frameLerp(5, 10, 5, -1)).toBe(5);
  });
});

describe('frameSlerp', () => {
  it('returns 0 when delta is 0', () => {
    expect(frameSlerp(5, 0)).toBe(0);
  });

  it('returns value between 0 and 1 for normal delta', () => {
    const t = frameSlerp(5, 0.016);
    expect(t).toBeGreaterThan(0);
    expect(t).toBeLessThan(1);
  });
});

describe('newtonRaphsonKepler', () => {
  it('solves circular orbit (e=0): E = M', () => {
    const M = 1.5;
    const E = newtonRaphsonKepler(M, 0);
    expect(E).toBeCloseTo(M, 8);
  });

  it('solves low eccentricity (e=0.1)', () => {
    const M = Math.PI / 3;
    const E = newtonRaphsonKepler(M, 0.1);
    // Verify: M = E - e*sin(E)
    const computed_M = E - 0.1 * Math.sin(E);
    expect(computed_M).toBeCloseTo(M, 8);
  });

  it('solves moderate eccentricity (e=0.5)', () => {
    const M = 2.0;
    const E = newtonRaphsonKepler(M, 0.5);
    const computed_M = E - 0.5 * Math.sin(E);
    expect(computed_M).toBeCloseTo(M, 8);
  });

  it('solves high eccentricity (e=0.9)', () => {
    const M = 0.5;
    const E = newtonRaphsonKepler(M, 0.9);
    const computed_M = E - 0.9 * Math.sin(E);
    expect(computed_M).toBeCloseTo(M, 6);
  });

  it('handles M = 0', () => {
    const E = newtonRaphsonKepler(0, 0.5);
    expect(E).toBeCloseTo(0, 8);
  });

  it('handles M = π', () => {
    const E = newtonRaphsonKepler(Math.PI, 0.5);
    const computed_M = E - 0.5 * Math.sin(E);
    expect(computed_M).toBeCloseTo(Math.PI, 8);
  });

  it('handles negative M (wraps to positive)', () => {
    const E = newtonRaphsonKepler(-1, 0.3);
    const m = ((-1 % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const computed_M = E - 0.3 * Math.sin(E);
    expect(computed_M).toBeCloseTo(m, 6);
  });
});

describe('keplerPosition', () => {
  it('returns (a-ae, 0) at E=0 — periapsis shifted', () => {
    const [x, y] = keplerPosition(10, 0.2, 0);
    // x = a*(cos(0) - e) = a*(1 - e)
    expect(x).toBeCloseTo(10 * (1 - 0.2), 8);
    expect(y).toBeCloseTo(0, 8);
  });

  it('returns (-a*(1+e), 0) at E=π — apoapsis', () => {
    const [x, y] = keplerPosition(10, 0.2, Math.PI);
    // x = a*(cos(π) - e) = a*(-1 - e)
    expect(x).toBeCloseTo(10 * (-1 - 0.2), 8);
    expect(Math.abs(y)).toBeLessThan(1e-8);
  });

  it('has correct b at E=π/2', () => {
    const a = 10;
    const e = 0.3;
    const b = a * Math.sqrt(1 - e * e);
    const [x, y] = keplerPosition(a, e, Math.PI / 2);
    // x = a*(cos(π/2) - e) = -a*e
    expect(x).toBeCloseTo(-a * e, 8);
    // y = b*sin(π/2) = b
    expect(y).toBeCloseTo(b, 8);
  });

  it('circular orbit (e=0): lies on circle', () => {
    const a = 15;
    for (let E = 0; E < Math.PI * 2; E += 0.5) {
      const [x, y] = keplerPosition(a, 0, E);
      const r = Math.sqrt(x * x + y * y);
      expect(r).toBeCloseTo(a, 8);
    }
  });
});

describe('keplerSpeed', () => {
  it('is faster at periapsis than apoapsis', () => {
    const a = 10;
    const e = 0.5;
    const rPeri = a * (1 - e); // 5
    const rApo = a * (1 + e); // 15
    const vPeri = keplerSpeed(rPeri, a);
    const vApo = keplerSpeed(rApo, a);
    expect(vPeri).toBeGreaterThan(vApo);
  });

  it('is constant for circular orbit', () => {
    const a = 10;
    const v1 = keplerSpeed(a, a);
    const v2 = keplerSpeed(a, a);
    expect(v1).toBeCloseTo(v2, 8);
  });
});
