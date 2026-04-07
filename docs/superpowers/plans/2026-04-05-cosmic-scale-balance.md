# Cosmic Scale Balance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebalance all celestial object proportions using physically-inspired compressed ratios and fix star surface detail loss at close range.

**Architecture:** Update scale constants across 7 files to achieve a consistent visual hierarchy (galaxy > black hole > star > planet > satellite). Add a multi-scale noise layer to the star surface shader so granulation detail persists at close camera distances.

**Tech Stack:** Three.js, React Three Fiber, GLSL shaders, TypeScript

**Spec:** `docs/superpowers/specs/2026-04-05-cosmic-scale-balance-design.md`

---

### Task 1: Update star scale presets

**Files:**

- Modify: `shared/src/constants/physics.ts`

- [ ] **Step 1: Update all 4 starScale values**

In `shared/src/constants/physics.ts`, change the `starScale` field in each preset:

```typescript
// PROTOSTAR (line ~80)
starScale: 3,

// MAIN_SEQUENCE (line ~111)
starScale: 4,

// GIANT (line ~142)
starScale: 6,

// RED_GIANT (line ~173)
starScale: 8,
```

- [ ] **Step 2: Verify shared package compiles**

Run: `cd /root/Cosmic-Engine && pnpm --filter @cosmic-engine/shared build 2>&1 || echo "no build script, checking types..." && cd shared && npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 3: Commit**

```bash
git add shared/src/constants/physics.ts
git commit -m "feat(shared): rebalance star scale presets (3/4/6/8)"
```

---

### Task 2: Update planet size formula

**Files:**

- Modify: `frontend/src/components/canvas/Planet.tsx:91`

- [ ] **Step 1: Change planetSize formula**

In `Planet.tsx` line 91, replace:

```typescript
const planetSize = useMemo(() => (1 + Math.log(physics.mass + 1) * 0.8) * 2, [physics.mass]);
```

with:

```typescript
const planetSize = useMemo(() => 0.6 + Math.log(physics.mass + 1) * 0.35, [physics.mass]);
```

This produces: mass=5→1.1, mass=8→1.4, mass=12→1.5, mass=15→1.6, mass=20→1.7 — always smaller than any star (min 3).

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/canvas/Planet.tsx
git commit -m "feat(planet): rebalance planet size formula (0.6 + ln*0.35)"
```

---

### Task 3: Update galaxy structure constants

**Files:**

- Modify: `frontend/src/components/canvas/Galaxy.tsx`

- [ ] **Step 1: Update galaxy physical parameters**

Change the constants block (around lines 38-49):

```typescript
const GALAXY_RADIUS = 200;
const DISK_SCALE_LENGTH = GALAXY_RADIUS / 3.5;
const DISK_SCALE_HEIGHT = 10;
const BULGE_EFFECTIVE_RADIUS = 18;
const BULGE_SERSIC_N = 4;
const ARM_WIDTH = 10;
```

- [ ] **Step 2: Update BH exclusion radius**

Change (around line 79):

```typescript
const BH_EXCLUSION_RADIUS = 25;
```

- [ ] **Step 3: Update star child positions**

Change the star child radial formula (around line 348):

```typescript
const r = 80 + idx * 25 + rand() * 10;
```

- [ ] **Step 4: Update BlackHole radius prop**

Change the `<BlackHole>` JSX (around line 569):

```tsx
<BlackHole
  accentColor={data.colorScheme.primary}
  radius={35}
  onClick={() => onGalaxyClick?.(data.slug)}
/>
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/canvas/Galaxy.tsx
git commit -m "feat(galaxy): rebalance galaxy structure (R=200, BH=35, arms=10)"
```

---

### Task 4: Update universe layout config

**Files:**

- Modify: `frontend/src/config/universeLayout.ts`

- [ ] **Step 1: Update all layout constants**

Replace the full file content with:

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/config/universeLayout.ts
git commit -m "feat(layout): update LOD thresholds and orbit ranges for new scale"
```

---

### Task 5: Update mock data orbit radii

**Files:**

- Modify: `frontend/src/config/mockUniverseData.ts`

- [ ] **Step 1: Update all 6 planet orbitRadius values**

Find and replace each `orbitRadius` in the mock data:

| Planet                     | Find               | Replace            |
| -------------------------- | ------------------ | ------------------ |
| React 19 (line ~37)        | `orbitRadius: 90`  | `orbitRadius: 75`  |
| Three.js (line ~68)        | `orbitRadius: 140` | `orbitRadius: 130` |
| TypeScript (line ~97)      | `orbitRadius: 70`  | `orbitRadius: 60`  |
| Go Concurrency (line ~140) | `orbitRadius: 120` | `orbitRadius: 110` |
| PostgreSQL (line ~167)     | `orbitRadius: 80`  | `orbitRadius: 70`  |
| Kubernetes (line ~219)     | `orbitRadius: 100` | `orbitRadius: 95`  |

- [ ] **Step 2: Commit**

```bash
git add frontend/src/config/mockUniverseData.ts
git commit -m "feat(mock): adjust planet orbit radii for new galaxy scale"
```

---

### Task 6: Update accretion disk shader parameters

**Files:**

- Modify: `frontend/src/shaders/blackHole.frag.glsl`

- [ ] **Step 1: Update disk geometry and rendering parameters**

In `sampleDisk()` function (around line 109), change:

```glsl
// Line 110: inner radius
float innerR = rs * 3.0;  // ISCO = 3rs (Schwarzschild exact)
// Line 111: outer radius
float outerR = rs * 12.0;
```

- [ ] **Step 2: Update turbulence sharpness and brightness**

In the same function, change:

```glsl
// Line ~167: turbulence sharpness 7.4 → 5.0
turbulence = pow(clamp(turbulence, 0.0, 1.0), 5.0);

// Line ~169: brightness 5.0 → 4.0
float brightness = (0.3 + 0.7 * turbulence) * edgeFade * 4.0;

// Line ~172: opacity 0.85 → 0.8
float alpha = clamp(brightness * 0.8, 0.0, 1.0);
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/shaders/blackHole.frag.glsl
git commit -m "feat(shader): adjust accretion disk to ISCO=3rs, brightness/turbulence tuning"
```

---

### Task 7: Add multi-scale star surface detail

**Files:**

- Modify: `frontend/src/shaders/starSurface.frag.glsl`

- [ ] **Step 1: Update granuleNoise to accept pixelSize and add fine detail layer**

Replace the `granuleNoise` function (lines 179-201) with:

```glsl
float granuleNoise(vec3 pos, float scale, float flowTime, float pixelSize) {
    // Domain warping: low-freq FBM displaces sampling coords
    float warpFreq = scale * 0.15;
    float warpX = fbm(pos * warpFreq, 3, 2.0, 0.6);
    float warpY = fbm(pos * warpFreq + vec3(31.7, 17.3, 0.0), 3, 2.0, 0.6);
    float warpZ = fbm(pos * warpFreq + vec3(0.0, 59.1, 23.5), 3, 2.0, 0.6);
    vec3 warpOffset = vec3(warpX, warpY, warpZ) * 2.5;

    // Animated position: slow z-drift for convection evolution
    vec3 animatedPos = pos + vec3(0.0, 0.0, flowTime * 0.3);
    vec3 warpedPos = animatedPos * scale + warpOffset;

    // Large-scale granulation (primary convection cells)
    float worleyLarge = worley3D(warpedPos, 0.85);
    float granuleLarge = pow(1.0 - worleyLarge, 2.5);

    // Small-scale mesogranulation
    float worleySmall = worley3D(warpedPos * 2.8, 0.85);
    float granuleSmall = pow(1.0 - worleySmall, 2.5);

    // 70% large + 30% small
    float baseGranule = mix(granuleLarge, granuleSmall, 0.3);

    // Ultra-fine detail layer — fades in when camera is close
    // pixelSize = starScale / distance; > 0.3 means close approach
    float fineMix = smoothstep(0.3, 1.0, pixelSize);
    if (fineMix > 0.01) {
        float worleyFine = worley3D(warpedPos * 7.0, 0.85);
        float fineDetail = pow(1.0 - worleyFine, 2.5);
        baseGranule = mix(baseGranule, mix(baseGranule, fineDetail, 0.25), fineMix);
    }

    return baseGranule;
}
```

- [ ] **Step 2: Update the call site in main()**

Change line 282 from:

```glsl
float granuleValue = granuleNoise(surfaceFlow + u_seed, u_granulationScale, flowTime);
```

to:

```glsl
float granuleValue = granuleNoise(surfaceFlow + u_seed, u_granulationScale, flowTime, u_pixelSize);
```

- [ ] **Step 3: Verify the dev server loads without shader errors**

Run: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/`
Expected: `200`

Check browser console for any WebGL shader compilation errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/shaders/starSurface.frag.glsl
git commit -m "feat(shader): add multi-scale star surface detail for close-up viewing"
```

---

### Task 8: Visual verification

- [ ] **Step 1: Restart dev server with clean cache**

```bash
kill $(lsof -t -i:3000) 2>/dev/null; rm -rf frontend/.next
cd frontend && pnpm dev &
sleep 5 && curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/
```

Expected: `200`

- [ ] **Step 2: Verify scale hierarchy in browser**

Open `http://localhost:3000/` and visually confirm:

- Galaxy disk is flat and wide (~1:20 thickness ratio)
- Black hole is proportionally smaller than before, centered in galaxy
- Stars (colored spheres on spiral arms) are clearly smaller than the black hole but clearly larger than planets
- Planets orbiting are visibly smaller than stars (~3:1 ratio)
- No star particles inside the black hole shadow
- Each galaxy's accretion disk has a distinct color tint
- Zooming into a star reveals fine granulation detail that persists at close range

- [ ] **Step 3: Commit all remaining changes (if any unstaged)**

```bash
git status
# If clean, skip. If any relevant unstaged changes:
git add -A && git commit -m "chore: cosmic scale balance complete"
```
