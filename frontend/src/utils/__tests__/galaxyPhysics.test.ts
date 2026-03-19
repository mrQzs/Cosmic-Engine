import { describe, it, expect } from 'vitest';
import {
  mulberry32,
  hashString,
  sampleExponentialDisk,
  sampleSersicBulge,
  sampleVerticalSech2,
  distToNearestArm,
  densityWaveEnhancement,
  temperatureToRGB,
  sampleStarTemperature,
  uniformRandomQuaternion,
} from '../galaxyPhysics';

describe('mulberry32 PRNG', () => {
  it('is deterministic: same seed → same sequence', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    for (let i = 0; i < 100; i++) {
      expect(a()).toBe(b());
    }
  });

  it('produces values in [0, 1)', () => {
    const rand = mulberry32(123);
    for (let i = 0; i < 1000; i++) {
      const v = rand();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('different seeds produce different sequences', () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    let same = 0;
    for (let i = 0; i < 100; i++) {
      if (a() === b()) same++;
    }
    expect(same).toBeLessThan(5); // Statistically near-zero
  });
});

describe('sampleExponentialDisk', () => {
  it('samples are non-negative', () => {
    const rand = mulberry32(10);
    for (let i = 0; i < 500; i++) {
      expect(sampleExponentialDisk(rand, 20)).toBeGreaterThanOrEqual(0);
    }
  });

  it('mean ≈ 2h (exponential disk mean)', () => {
    const h = 20;
    const rand = mulberry32(42);
    let sum = 0;
    const N = 5000;
    for (let i = 0; i < N; i++) sum += sampleExponentialDisk(rand, h);
    const mean = sum / N;
    // Theoretical mean of r*exp(-r/h) distribution is 2h
    expect(mean).toBeGreaterThan(h * 1.5);
    expect(mean).toBeLessThan(h * 2.5);
  });
});

describe('sampleSersicBulge', () => {
  it('most samples are within 4 × rₑ', () => {
    const re = 8;
    const rand = mulberry32(55);
    let outside = 0;
    const N = 1000;
    for (let i = 0; i < N; i++) {
      if (sampleSersicBulge(rand, re, 4) > re * 4) outside++;
    }
    expect(outside).toBe(0); // By construction, rejection sampling caps at 4×rₑ
  });
});

describe('sampleVerticalSech2', () => {
  it('distribution is symmetric around 0', () => {
    const rand = mulberry32(77);
    let pos = 0,
      neg = 0;
    const N = 2000;
    for (let i = 0; i < N; i++) {
      if (sampleVerticalSech2(rand, 1.5) > 0) pos++;
      else neg++;
    }
    // Should be roughly 50/50
    expect(Math.abs(pos - neg) / N).toBeLessThan(0.1);
  });

  it('scale height controls spread', () => {
    const rand1 = mulberry32(1);
    const rand2 = mulberry32(1);
    let var1 = 0,
      var2 = 0;
    const N = 2000;
    for (let i = 0; i < N; i++) {
      const z1 = sampleVerticalSech2(rand1, 1);
      const z2 = sampleVerticalSech2(rand2, 5);
      var1 += z1 * z1;
      var2 += z2 * z2;
    }
    expect(var2 / N).toBeGreaterThan((var1 / N) * 3);
  });
});

describe('densityWaveEnhancement', () => {
  it('returns ~3 on arm center', () => {
    expect(densityWaveEnhancement(0, 5)).toBeCloseTo(3, 1);
  });

  it('returns ~1 far from arm', () => {
    expect(densityWaveEnhancement(50, 5)).toBeCloseTo(1, 1);
  });

  it('is monotonically decreasing with distance', () => {
    const a = densityWaveEnhancement(2, 5);
    const b = densityWaveEnhancement(10, 5);
    const c = densityWaveEnhancement(30, 5);
    expect(a).toBeGreaterThan(b);
    expect(b).toBeGreaterThan(c);
  });
});

describe('temperatureToRGB (blackbody)', () => {
  it('M-type (3000K) is reddish', () => {
    const c = temperatureToRGB(3000);
    expect(c.r).toBeGreaterThan(c.b); // Red > Blue
  });

  it('Sun-type (5778K) is yellowish-white', () => {
    const c = temperatureToRGB(5778);
    expect(c.r).toBeGreaterThan(0.8);
    expect(c.g).toBeGreaterThan(0.7);
  });

  it('O-type (30000K) is bluish', () => {
    const c = temperatureToRGB(30000);
    expect(c.b).toBeGreaterThan(c.r * 0.8); // Blue comparable or greater
  });

  it('all channels in [0, 1]', () => {
    for (const T of [2000, 3000, 5000, 8000, 15000, 30000, 50000]) {
      const c = temperatureToRGB(T);
      expect(c.r).toBeGreaterThanOrEqual(0);
      expect(c.r).toBeLessThanOrEqual(1);
      expect(c.g).toBeGreaterThanOrEqual(0);
      expect(c.g).toBeLessThanOrEqual(1);
      expect(c.b).toBeGreaterThanOrEqual(0);
      expect(c.b).toBeLessThanOrEqual(1);
    }
  });
});

describe('uniformRandomQuaternion (SO(3) sampling)', () => {
  it('produces unit quaternions', () => {
    const rand = mulberry32(99);
    for (let i = 0; i < 100; i++) {
      const [x, y, z, w] = uniformRandomQuaternion(rand);
      const norm = Math.sqrt(x * x + y * y + z * z + w * w);
      expect(norm).toBeCloseTo(1, 6);
    }
  });

  it('is deterministic', () => {
    const a = uniformRandomQuaternion(mulberry32(42));
    const b = uniformRandomQuaternion(mulberry32(42));
    expect(a).toEqual(b);
  });
});
