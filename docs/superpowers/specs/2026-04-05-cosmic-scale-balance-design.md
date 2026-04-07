# Cosmic Scale Balance Design

**Date:** 2026-04-05
**Goal:** Achieve physically-inspired visual balance between galaxies, black holes, stars, and planets, plus fix star surface detail loss at close range.

## Approach

Mixed: fixed compressed logarithmic scale ratios ensuring clear visual hierarchy (star > planet > satellite) while maintaining artistic appeal. Not 1:1 realistic, but inspired by real astrophysics.

## 1. Scale Hierarchy

| Object                | Visual Radius (units) | Galaxy Ratio | Notes                         |
| --------------------- | --------------------- | ------------ | ----------------------------- |
| Galaxy disk radius    | 200                   | 1            | Base reference                |
| Galaxy disk thickness | 10                    | 1:20         | Real 1:100 compressed to 1:20 |
| BlackHole billboard   | 35                    | 1:5.7        | Shadow area ~15 units         |
| BH exclusion radius   | 25                    | —            | Matches shadow visual area    |
| Star (Red Giant)      | 8                     | 1:25         | Largest star                  |
| Star (Giant)          | 6                     | 1:33         | —                             |
| Star (Main Sequence)  | 4                     | 1:50         | Standard star                 |
| Star (Protostar)      | 3                     | 1:67         | Smallest star                 |
| Planet (mass=20)      | ~1.8                  | 1:111        | Largest planet                |
| Planet (mass=8)       | ~1.3                  | 1:154        | Medium planet                 |
| Planet (mass=5)       | ~1.1                  | 1:182        | Small planet                  |

Key ratios:

- Star : Planet ≈ 3–4:1 (compressed from real 10–100:1)
- BH shadow : Star ≈ 4:1 (loosely inspired by Sgr A\* ~17 solar radii)
- Galaxy : Star ≈ 50:1 (compressed from 10^12:1)

**Planet size formula:** `0.6 + ln(mass+1) * 0.35` (range ~1.0–1.8, always smaller than any star)

## 2. Galaxy Internal Structure

| Parameter              | Current | New     | Rationale                        |
| ---------------------- | ------- | ------- | -------------------------------- |
| GALAXY_RADIUS          | 180     | 200     | Slight increase                  |
| DISK_SCALE_HEIGHT      | 4.0     | 10      | 1:20 aspect ratio                |
| BULGE_EFFECTIVE_RADIUS | 20      | 18      | ~10% of disk radius (real ratio) |
| ARM_WIDTH              | 12      | 10      | ~5% of disk radius (real ratio)  |
| BH_EXCLUSION_RADIUS    | 40      | 25      | Matches smaller black hole       |
| Star child start r     | 90      | 80      | BH is smaller, can start closer  |
| Star child spacing     | idx\*30 | idx\*25 | Even distribution across disk    |
| BlackHole radius prop  | 60      | 35      | Scaled down                      |

## 3. Orbit & Layout Parameters

| Parameter              | Current | New  |
| ---------------------- | ------- | ---- |
| PLANET_ORBIT.radiusMin | 60      | 50   |
| PLANET_ORBIT.radiusMax | 250     | 200  |
| GALAXY_BAND.minSpacing | 600     | 500  |
| LOD.galaxyFar          | 1500    | 1200 |
| LOD.galaxyMid/Near     | 600     | 500  |
| LOD.planetFar          | 400     | 300  |
| LOD.planetNear         | 160     | 120  |
| FLY_TO.focusOffset     | 80      | 60   |

## 4. Star Multi-Scale Surface Detail Fix

**Problem:** `granuleNoise()` uses fixed-frequency Worley noise (scale=48). Close up, only 1-2 convection cells visible → smooth gradient, no detail.

**Solution:** Distance-adaptive detail layering. When `u_pixelSize > 0.3` (camera close), blend in a third ultra-fine Worley noise layer at 7× frequency:

```glsl
float granuleFine = worley3D(warpedPos * 7.0, 0.85);
float fineDetail = pow(1.0 - granuleFine, 2.5);
float fineMix = smoothstep(0.3, 1.0, u_pixelSize);
return mix(baseGranule, mix(baseGranule, fineDetail, 0.25), fineMix);
```

Effect: far → convection cell texture → mid → granules → close → ultra-fine mesogranulation structure.

## 5. Accretion Disk Parameters

| Parameter             | Current | New    | Rationale                          |
| --------------------- | ------- | ------ | ---------------------------------- |
| innerR                | 5rs     | 3rs    | ISCO = 3rs (Schwarzschild exact)   |
| outerR                | 18rs    | 12rs   | Fits smaller billboard             |
| peakTemp              | 50000K  | 50000K | Unchanged                          |
| Temperature falloff   | 5.0     | 5.0    | Keep sharp ring style              |
| Gravitational lensing | 2.4     | 2.4    | Unchanged                          |
| Turbulence sharpness  | 7.4     | 5.0    | Slightly lower for visible texture |
| Disk brightness       | 5.0     | 4.0    | Reduce overexposure                |
| Opacity factor        | 0.85    | 0.8    | Slight adjustment                  |

Accent color mixing: `bbColor * (0.3 + 0.7 * accentColor)` — produces distinct per-galaxy disk colors.

## 6. Mock Data Orbit Adjustments

| Planet                | Current | New |
| --------------------- | ------- | --- |
| React 19              | 90      | 75  |
| Three.js Shaders      | 140     | 130 |
| TypeScript Gymnastics | 70      | 60  |
| Go Concurrency        | 120     | 110 |
| PostgreSQL Tuning     | 80      | 70  |
| Kubernetes Guide      | 100     | 95  |

## 7. Files to Modify

| File                                         | Changes                                                                                                  |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `shared/src/constants/physics.ts`            | starScale for 4 presets                                                                                  |
| `frontend/src/components/canvas/Galaxy.tsx`  | GALAXY_RADIUS, DISK_SCALE_HEIGHT, BULGE, ARM_WIDTH, BH_EXCLUSION, star child positions, BlackHole radius |
| `frontend/src/components/canvas/Planet.tsx`  | planetSize formula                                                                                       |
| `frontend/src/shaders/starSurface.frag.glsl` | granuleNoise multi-scale detail layer                                                                    |
| `frontend/src/shaders/blackHole.frag.glsl`   | innerR, outerR, turbulence, brightness                                                                   |
| `frontend/src/config/universeLayout.ts`      | PLANET_ORBIT, LOD, FLY_TO, GALAXY_BAND                                                                   |
| `frontend/src/config/mockUniverseData.ts`    | orbitRadius × 6 planets                                                                                  |
