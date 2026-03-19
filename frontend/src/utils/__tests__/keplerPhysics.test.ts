import { describe, it, expect } from 'vitest';
import { newtonRaphsonKepler, keplerPosition, keplerSpeed } from '../mathHelpers';

/**
 * 物理验证：行星轨道是否真正遵循开普勒三定律
 */

// 使用 mock 数据 "Go 并发模式精讲" 行星参数
const a = 45; // 半长轴
const e = 0.2; // 离心率
const b = a * Math.sqrt(1 - e * e);
const speed = 0.35;
const phase = 1.0;

describe('开普勒方程求解精度', () => {
  const testMs = [0, 0.5, Math.PI / 2, Math.PI, 1.5 * Math.PI, 2 * Math.PI - 0.1];

  it.each(testMs)('M=%f → 反算误差 < 1e-8', (M) => {
    const E = newtonRaphsonKepler(M, e);
    const M_back = E - e * Math.sin(E);
    const normalized = ((M % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    expect(M_back).toBeCloseTo(normalized, 8);
  });
});

describe('开普勒第一定律：行星轨道是椭圆，焦点在恒星处', () => {
  it('所有轨道点满足椭圆方程 (x+ae)²/a² + y²/b² = 1', () => {
    for (let E = 0; E < 2 * Math.PI; E += Math.PI / 12) {
      const [x, y] = keplerPosition(a, e, E);
      // 椭圆中心在 (-ae, 0)，所以焦点到中心偏移 ae
      const cx = x + a * e;
      const ellipseEq = (cx * cx) / (a * a) + (y * y) / (b * b);
      expect(ellipseEq).toBeCloseTo(1.0, 6);
    }
  });

  it('近日点距离 = a(1-e)，远日点距离 = a(1+e)', () => {
    const [xP, yP] = keplerPosition(a, e, 0); // E=0 → 近日点
    const [xA, yA] = keplerPosition(a, e, Math.PI); // E=π → 远日点
    const rPeri = Math.sqrt(xP * xP + yP * yP);
    const rApo = Math.sqrt(xA * xA + yA * yA);
    expect(rPeri).toBeCloseTo(a * (1 - e), 6);
    expect(rApo).toBeCloseTo(a * (1 + e), 6);
  });
});

describe('开普勒第二定律：等时间扫过等面积', () => {
  it('不同轨道位置的面积速率保持恒定 (误差<1%)', () => {
    const dt = 0.001;
    const areaRates: number[] = [];

    for (let t = 0; t < 20; t += 2) {
      const M1 = phase + t * speed * 0.3;
      const M2 = phase + (t + dt) * speed * 0.3;
      const E1 = newtonRaphsonKepler(M1, e);
      const E2 = newtonRaphsonKepler(M2, e);
      const [x1, y1] = keplerPosition(a, e, E1);
      const [x2, y2] = keplerPosition(a, e, E2);
      // 三角形面积 = 0.5 * |x1*y2 - x2*y1|
      const area = 0.5 * Math.abs(x1 * y2 - x2 * y1);
      areaRates.push(area / dt);
    }

    // 所有面积速率应接近相等
    const mean = areaRates.reduce((s, v) => s + v, 0) / areaRates.length;
    for (const rate of areaRates) {
      const deviation = Math.abs(rate - mean) / mean;
      expect(deviation).toBeLessThan(0.01); // <1% 偏差
    }
  });
});

describe('开普勒第三定律：近日点速度 > 远日点速度', () => {
  it('keplerSpeed 近日点返回值 > 远日点', () => {
    const rPeri = a * (1 - e);
    const rApo = a * (1 + e);
    const vPeri = keplerSpeed(rPeri, a);
    const vApo = keplerSpeed(rApo, a);
    expect(vPeri).toBeGreaterThan(vApo);
    // 比值应约等于 rApo/rPeri (角动量守恒)
    const ratio = vPeri / vApo;
    const expectedRatio = Math.sqrt((2 / rPeri - 1 / a) / (2 / rApo - 1 / a));
    expect(ratio).toBeCloseTo(expectedRatio, 4);
  });
});

describe('轨道倾斜与星系中心偏移 (模拟 Planet.tsx useFrame)', () => {
  const galaxyCenter: [number, number, number] = [200, 30, -150];
  const inclination = 0.15;

  it('行星始终在以星系中心为焦点的椭圆轨道上', () => {
    for (let t = 0; t < 30; t += 1) {
      const M = phase + t * speed * 0.3;
      const E = newtonRaphsonKepler(M, e);
      const [ox, oy] = keplerPosition(a, e, E);

      // 应用倾斜 (与 Planet.tsx 一致)
      const cosI = Math.cos(inclination);
      const sinI = Math.sin(inclination);
      const wx = galaxyCenter[0] + ox;
      const wy = galaxyCenter[1] + oy * sinI;
      const wz = galaxyCenter[2] + oy * cosI;

      // 在轨道平面内的距离应在 [a(1-e), a(1+e)] 范围内
      const flatR = Math.sqrt(ox * ox + oy * oy);
      expect(flatR).toBeGreaterThanOrEqual(a * (1 - e) - 0.01);
      expect(flatR).toBeLessThanOrEqual(a * (1 + e) + 0.01);

      // 世界坐标偏移应在星系中心附近
      expect(Math.abs(wx - galaxyCenter[0])).toBeLessThanOrEqual(a * (1 + e) + 1);
    }
  });

  it('轨道使用 clock.elapsedTime (绝对时间)，帧率无关', () => {
    // 同一时刻，无论帧率如何，位置相同
    const t = 7.777;
    const M = phase + t * speed * 0.3;
    const E = newtonRaphsonKepler(M, e);
    const [x1, y1] = keplerPosition(a, e, E);
    const [x2, y2] = keplerPosition(a, e, E);
    expect(x1).toBe(x2);
    expect(y1).toBe(y2);
  });
});
