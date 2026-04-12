# Complete Universe Simulation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render a complete CyberGeek universe with ALL celestial body types using mock data — galaxies, black holes, stars, planets, satellites, comets, wormholes, pulsar, star gates, nebulae, meteor showers, constellations.

**Architecture:** Five new R3F components (Comet, Wormhole, Pulsar, StarGate, MeteorShower) follow existing patterns: `useFrame` with delta/elapsedTime, `useRef` for per-frame mutations, quality-aware rendering. Mock data is extended with new celestial types. Universe.tsx is updated to orchestrate all components.

**Tech Stack:** React Three Fiber, Three.js, GLSL shaders, Zustand, TypeScript

**Key conventions (from CLAUDE.md / existing code):**

- `useFrame` incremental animations MUST multiply by `delta`; orbits use `clock.elapsedTime`
- Zustand precise field selectors only
- `useRef` + direct mutation in `useFrame`, never `useState`
- GPU resources: `.dispose()` in cleanup effects
- Particles: `InstancedMesh` + object pool, hide via zero-scale matrix

---

## File Structure

### New files to create:

- `frontend/src/components/canvas/Comet.tsx` — 彗星 (pinned articles), trail particles + glowing head
- `frontend/src/components/canvas/Wormhole.tsx` — 虫洞 (archive entry), torus + distortion shader
- `frontend/src/components/canvas/Pulsar.tsx` — 脉冲星 (about page), rotating + polar jets
- `frontend/src/components/canvas/StarGate.tsx` — 星际门 (friend links), ring + portal effect
- `frontend/src/components/canvas/MeteorShower.tsx` — 流星雨 (recent activity), streaking particles

### Files to modify:

- `frontend/src/config/mockUniverseData.ts` — Add comets, wormholes, pulsar, star gates, meteor config
- `frontend/src/hooks/useUniverseData.ts` — Extend types for new celestial data
- `frontend/src/components/canvas/Universe.tsx` — Render all new components

---

## Task 1: Extend Data Types and Mock Data

**Files:**

- Modify: `frontend/src/hooks/useUniverseData.ts`
- Modify: `frontend/src/config/mockUniverseData.ts`

- [ ] **Step 1: Add new data types to useUniverseData.ts**

Add these interfaces after the existing `GalaxyData` interface:

```typescript
export interface CometData {
  id: string;
  title: string;
  slug: string;
  color: string;
  /** Path control points in world space */
  pathPoints: { x: number; y: number; z: number }[];
  speed: number;
}

export interface WormholeData {
  id: string;
  year: number;
  position: { x: number; y: number; z: number };
  color: string;
}

export interface PulsarData {
  position: { x: number; y: number; z: number };
  color: string;
  rotationSpeed: number;
}

export interface StarGateData {
  id: string;
  name: string;
  url: string;
  position: { x: number; y: number; z: number };
  color: string;
}

export interface MeteorShowerConfig {
  /** Number of simultaneous meteors */
  count: number;
  /** Spawn radius around origin */
  spawnRadius: number;
  color: string;
}

export interface UniverseSceneData {
  galaxies: GalaxyData[];
  comets: CometData[];
  wormholes: WormholeData[];
  pulsar: PulsarData;
  starGates: StarGateData[];
  meteorShower: MeteorShowerConfig;
}
```

Update the `useUniverseData` return type to include these. After the `useMock` block add:

```typescript
import {
  MOCK_GALAXIES,
  MOCK_COMETS,
  MOCK_WORMHOLES,
  MOCK_PULSAR,
  MOCK_STARGATES,
  MOCK_METEOR_SHOWER,
} from '@/config/mockUniverseData';

// In the useMock branch:
if (useMock) {
  return {
    galaxies: MOCK_GALAXIES as GalaxyData[],
    comets: MOCK_COMETS,
    wormholes: MOCK_WORMHOLES,
    pulsar: MOCK_PULSAR,
    starGates: MOCK_STARGATES,
    meteorShower: MOCK_METEOR_SHOWER,
    stats: null,
    loading: false,
    error: undefined,
  };
}

return {
  galaxies: data?.universe.galaxies ?? [],
  comets: [] as CometData[],
  wormholes: [] as WormholeData[],
  pulsar: { position: { x: 0, y: 50, z: 0 }, color: '#38bdf8', rotationSpeed: 2.0 },
  starGates: [] as StarGateData[],
  meteorShower: { count: 5, spawnRadius: 800, color: '#38bdf8' },
  stats: data?.universe.stats ?? null,
  loading,
  error,
};
```

- [ ] **Step 2: Add mock data for new celestial types in mockUniverseData.ts**

Add these exports after the `MOCK_GALAXIES` array:

```typescript
import type {
  CometData,
  WormholeData,
  PulsarData,
  StarGateData,
  MeteorShowerConfig,
} from '@/hooks/useUniverseData';

export const MOCK_COMETS: CometData[] = [
  {
    id: 'comet-1',
    title: 'React 19 新特性详解',
    slug: 'react-19-features',
    color: '#61dafb',
    pathPoints: [
      { x: -300, y: 40, z: 200 },
      { x: -100, y: 20, z: 50 },
      { x: 100, y: -10, z: -100 },
      { x: 300, y: 30, z: -250 },
    ],
    speed: 0.08,
  },
  {
    id: 'comet-2',
    title: 'Go 并发模式精讲',
    slug: 'go-concurrency',
    color: '#00ADD8',
    pathPoints: [
      { x: 250, y: -30, z: 300 },
      { x: 50, y: 50, z: 100 },
      { x: -150, y: -20, z: -50 },
      { x: -350, y: 10, z: -200 },
    ],
    speed: 0.06,
  },
];

export const MOCK_WORMHOLES: WormholeData[] = [
  { id: 'wh-2026', year: 2026, position: { x: 400, y: 0, z: -300 }, color: '#6b21a8' },
  { id: 'wh-2025', year: 2025, position: { x: 450, y: 20, z: -250 }, color: '#7c3aed' },
  { id: 'wh-2024', year: 2024, position: { x: 500, y: -10, z: -200 }, color: '#8b5cf6' },
];

export const MOCK_PULSAR: PulsarData = {
  position: { x: 0, y: 80, z: -400 },
  color: '#38bdf8',
  rotationSpeed: 3.0,
};

export const MOCK_STARGATES: StarGateData[] = [
  {
    id: 'sg-1',
    name: 'GitHub',
    url: 'https://github.com',
    position: { x: -350, y: 30, z: -100 },
    color: '#e2e8f0',
  },
  {
    id: 'sg-2',
    name: 'V2EX',
    url: 'https://v2ex.com',
    position: { x: 200, y: -40, z: 350 },
    color: '#38bdf8',
  },
  {
    id: 'sg-3',
    name: 'Hacker News',
    url: 'https://news.ycombinator.com',
    position: { x: -100, y: 60, z: 400 },
    color: '#fb923c',
  },
];

export const MOCK_METEOR_SHOWER: MeteorShowerConfig = {
  count: 8,
  spawnRadius: 600,
  color: '#38bdf8',
};
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd /root/Cosmic-Engine/frontend && npx tsc --noEmit 2>&1 | head -30`

- [ ] **Step 4: Commit**

```bash
git add frontend/src/hooks/useUniverseData.ts frontend/src/config/mockUniverseData.ts
git commit -m "feat: extend universe data types with comets, wormholes, pulsar, stargates, meteors"
```

---

## Task 2: Comet Component (置顶文章)

**Files:**

- Create: `frontend/src/components/canvas/Comet.tsx`

- [ ] **Step 1: Create Comet.tsx**

A comet follows a Catmull-Rom spline path through space with a glowing head and particle trail.

```tsx
'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { CometData } from '@/hooks/useUniverseData';

const TRAIL_LENGTH = 60;
const TRAIL_SEGMENTS = 3;

interface CometProps {
  data: CometData;
  onClick?: (slug: string) => void;
}

export default function Comet({ data, onClick }: CometProps) {
  const headRef = useRef<THREE.Mesh>(null);
  const trailRef = useRef<THREE.InstancedMesh>(null);
  const progressRef = useRef(Math.random()); // random start position on path

  const curve = useMemo(() => {
    const points = data.pathPoints.map((p) => new THREE.Vector3(p.x, p.y, p.z));
    return new THREE.CatmullRomCurve3(points, true, 'centripetal', 0.5);
  }, [data.pathPoints]);

  const color = useMemo(() => new THREE.Color(data.color), [data.color]);

  // Pre-allocate trail matrices
  const trailPositions = useRef<THREE.Vector3[]>(
    Array.from({ length: TRAIL_LENGTH }, () => new THREE.Vector3()),
  );

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((_, delta) => {
    if (!headRef.current || !trailRef.current) return;

    // Advance along path
    progressRef.current = (progressRef.current + data.speed * delta) % 1;

    // Head position
    const headPos = curve.getPointAt(progressRef.current);
    headRef.current.position.copy(headPos);

    // Update trail history (shift and add new position)
    const positions = trailPositions.current;
    for (let i = positions.length - 1; i > 0; i--) {
      positions[i].copy(positions[i - 1]);
    }
    positions[0].copy(headPos);

    // Update InstancedMesh matrices for trail
    for (let i = 0; i < TRAIL_LENGTH; i++) {
      const t = i / TRAIL_LENGTH;
      const scale = Math.max(0.01, (1 - t) * 0.8); // fade out towards tail
      dummy.position.copy(positions[i]);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      trailRef.current.setMatrixAt(i, dummy.matrix);
    }
    trailRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      {/* Comet head — glowing sphere */}
      <mesh ref={headRef} onClick={() => onClick?.(data.slug)}>
        <sphereGeometry args={[2, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.95} />
      </mesh>

      {/* Head glow */}
      <mesh ref={headRef}>
        <sphereGeometry args={[4, 8, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.15} />
      </mesh>

      {/* Trail particles */}
      <instancedMesh ref={trailRef} args={[undefined, undefined, TRAIL_LENGTH]}>
        <sphereGeometry args={[1, TRAIL_SEGMENTS, TRAIL_SEGMENTS]} />
        <meshBasicMaterial color={color} transparent opacity={0.4} />
      </instancedMesh>
    </group>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /root/Cosmic-Engine/frontend && npx tsc --noEmit 2>&1 | head -20`

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/canvas/Comet.tsx
git commit -m "feat: add Comet component for pinned articles"
```

---

## Task 3: Wormhole Component (虫洞)

**Files:**

- Create: `frontend/src/components/canvas/Wormhole.tsx`

- [ ] **Step 1: Create Wormhole.tsx**

A wormhole is a torus ring with swirling distortion effect and a glowing portal center.

```tsx
'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { WormholeData } from '@/hooks/useUniverseData';

interface WormholeProps {
  data: WormholeData;
  onClick?: (year: number) => void;
}

const VORTEX_FRAG = `
varying vec2 vUv;
uniform float u_time;
uniform vec3 u_color;

void main() {
  vec2 uv = vUv - 0.5;
  float dist = length(uv);
  float angle = atan(uv.y, uv.x);

  // Swirling vortex pattern
  float spiral = sin(angle * 5.0 + dist * 20.0 - u_time * 3.0) * 0.5 + 0.5;
  float glow = smoothstep(0.5, 0.0, dist);
  float alpha = glow * (0.3 + 0.7 * spiral) * smoothstep(0.5, 0.1, dist);

  vec3 color = u_color * (1.0 + spiral * 0.5);
  gl_FragColor = vec4(color, alpha);
}
`;

const VORTEX_VERT = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export default function Wormhole({ data, onClick }: WormholeProps) {
  const groupRef = useRef<THREE.Group>(null);
  const portalRef = useRef<THREE.Mesh>(null);

  const color = useMemo(() => new THREE.Color(data.color), [data.color]);

  const uniforms = useMemo(
    () => ({
      u_time: { value: 0 },
      u_color: { value: color },
    }),
    [color],
  );

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    // Slow rotation of the ring
    groupRef.current.rotation.z = clock.elapsedTime * 0.3;
    uniforms.u_time.value = clock.elapsedTime;
  });

  return (
    <group
      position={[data.position.x, data.position.y, data.position.z]}
      onClick={() => onClick?.(data.year)}
    >
      {/* Torus ring frame */}
      <group ref={groupRef}>
        <mesh>
          <torusGeometry args={[12, 1.5, 16, 48]} />
          <meshStandardMaterial
            color={data.color}
            emissive={data.color}
            emissiveIntensity={0.5}
            roughness={0.3}
            metalness={0.8}
          />
        </mesh>
      </group>

      {/* Portal vortex (flat disc inside the torus) */}
      <mesh ref={portalRef}>
        <circleGeometry args={[11, 48]} />
        <shaderMaterial
          vertexShader={VORTEX_VERT}
          fragmentShader={VORTEX_FRAG}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Year label — will be replaced by Drei Text later, placeholder glow */}
      <pointLight color={data.color} intensity={2} distance={60} />
    </group>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /root/Cosmic-Engine/frontend && npx tsc --noEmit 2>&1 | head -20`

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/canvas/Wormhole.tsx
git commit -m "feat: add Wormhole component for time travel archive"
```

---

## Task 4: Pulsar Component (脉冲星)

**Files:**

- Create: `frontend/src/components/canvas/Pulsar.tsx`

- [ ] **Step 1: Create Pulsar.tsx**

A pulsar is a rapidly rotating sphere with two polar jet beams and periodic flashing.

```tsx
'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { PulsarData } from '@/hooks/useUniverseData';

interface PulsarProps {
  data: PulsarData;
  onClick?: () => void;
}

const JET_COUNT = 80;

export default function Pulsar({ data, onClick }: PulsarProps) {
  const coreRef = useRef<THREE.Mesh>(null);
  const jetTopRef = useRef<THREE.InstancedMesh>(null);
  const jetBottomRef = useRef<THREE.InstancedMesh>(null);
  const glowRef = useRef<THREE.PointLight>(null);

  const color = useMemo(() => new THREE.Color(data.color), [data.color]);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;

    if (coreRef.current) {
      // Fast rotation
      coreRef.current.rotation.y = t * data.rotationSpeed;
    }

    // Periodic flash (pulse)
    const pulse = Math.sin(t * data.rotationSpeed * 2) * 0.5 + 0.5;
    if (glowRef.current) {
      glowRef.current.intensity = 2 + pulse * 4;
    }

    // Animate jet particles
    const updateJet = (mesh: THREE.InstancedMesh | null, direction: number) => {
      if (!mesh) return;
      for (let i = 0; i < JET_COUNT; i++) {
        const progress = (t * 2 + i * 0.05) % 1.5;
        const y = progress * 40 * direction;
        const spread = progress * 3;
        const angle = i * 2.399 + t; // golden angle spread
        const x = Math.cos(angle) * spread;
        const z = Math.sin(angle) * spread;
        const scale = Math.max(0.01, (1 - progress / 1.5) * 0.6);

        dummy.position.set(x, y, z);
        dummy.scale.setScalar(scale);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    };

    updateJet(jetTopRef.current, 1);
    updateJet(jetBottomRef.current, -1);
  });

  return (
    <group position={[data.position.x, data.position.y, data.position.z]} onClick={onClick}>
      {/* Core sphere */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[3, 24, 24]} />
        <meshStandardMaterial
          color={data.color}
          emissive={data.color}
          emissiveIntensity={1.5}
          roughness={0.2}
          metalness={0.9}
        />
      </mesh>

      {/* Glow */}
      <mesh>
        <sphereGeometry args={[5, 12, 12]} />
        <meshBasicMaterial color={color} transparent opacity={0.1} />
      </mesh>

      {/* Top jet */}
      <instancedMesh ref={jetTopRef} args={[undefined, undefined, JET_COUNT]}>
        <sphereGeometry args={[0.5, 4, 4]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} />
      </instancedMesh>

      {/* Bottom jet */}
      <instancedMesh ref={jetBottomRef} args={[undefined, undefined, JET_COUNT]}>
        <sphereGeometry args={[0.5, 4, 4]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} />
      </instancedMesh>

      {/* Point light for illumination + pulse */}
      <pointLight ref={glowRef} color={data.color} intensity={3} distance={100} />
    </group>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /root/Cosmic-Engine/frontend && npx tsc --noEmit 2>&1 | head -20`

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/canvas/Pulsar.tsx
git commit -m "feat: add Pulsar component for about page"
```

---

## Task 5: StarGate Component (星际门)

**Files:**

- Create: `frontend/src/components/canvas/StarGate.tsx`

- [ ] **Step 1: Create StarGate.tsx**

A star gate is a smaller ring structure with a shimmering portal, representing friend links.

```tsx
'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { StarGateData } from '@/hooks/useUniverseData';

interface StarGateProps {
  data: StarGateData;
  onClick?: (id: string) => void;
}

export default function StarGate({ data, onClick }: StarGateProps) {
  const groupRef = useRef<THREE.Group>(null);
  const portalRef = useRef<THREE.Mesh>(null);
  const opacityRef = useRef(0.3);
  const hovered = useRef(false);

  const color = useMemo(() => new THREE.Color(data.color), [data.color]);

  useFrame(({ clock }, delta) => {
    if (!groupRef.current || !portalRef.current) return;

    // Gentle bobbing
    groupRef.current.position.y = data.position.y + Math.sin(clock.elapsedTime * 0.5) * 2;

    // Slow rotation
    groupRef.current.rotation.y = clock.elapsedTime * 0.2;

    // Hover opacity animation
    const targetOpacity = hovered.current ? 0.6 : 0.25;
    opacityRef.current += (targetOpacity - opacityRef.current) * 3 * delta;

    const mat = portalRef.current.material as THREE.MeshBasicMaterial;
    mat.opacity = opacityRef.current;
  });

  return (
    <group
      ref={groupRef}
      position={[data.position.x, data.position.y, data.position.z]}
      onClick={() => onClick?.(data.id)}
      onPointerEnter={() => {
        hovered.current = true;
      }}
      onPointerLeave={() => {
        hovered.current = false;
      }}
    >
      {/* Ring frame */}
      <mesh>
        <torusGeometry args={[6, 0.8, 12, 32]} />
        <meshStandardMaterial
          color={data.color}
          emissive={data.color}
          emissiveIntensity={0.4}
          roughness={0.4}
          metalness={0.7}
        />
      </mesh>

      {/* Portal shimmer */}
      <mesh ref={portalRef}>
        <circleGeometry args={[5.5, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>

      {/* Ambient glow */}
      <pointLight color={data.color} intensity={1} distance={40} />
    </group>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /root/Cosmic-Engine/frontend && npx tsc --noEmit 2>&1 | head -20`

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/canvas/StarGate.tsx
git commit -m "feat: add StarGate component for friend links"
```

---

## Task 6: MeteorShower Component (流星雨)

**Files:**

- Create: `frontend/src/components/canvas/MeteorShower.tsx`

- [ ] **Step 1: Create MeteorShower.tsx**

Occasional meteors streak across the scene to indicate recent activity.

```tsx
'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { MeteorShowerConfig } from '@/hooks/useUniverseData';

interface MeteorShowerProps {
  config: MeteorShowerConfig;
}

interface MeteorState {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
}

function randomDirection(): THREE.Vector3 {
  return new THREE.Vector3(
    (Math.random() - 0.5) * 2,
    (Math.random() - 0.5) * 0.5,
    (Math.random() - 0.5) * 2,
  ).normalize();
}

function spawnMeteor(radius: number): MeteorState {
  const pos = new THREE.Vector3(
    (Math.random() - 0.5) * radius * 2,
    (Math.random() - 0.5) * radius * 0.5,
    (Math.random() - 0.5) * radius * 2,
  );
  const vel = randomDirection().multiplyScalar(80 + Math.random() * 120);
  const maxLife = 1.5 + Math.random() * 2;
  return { position: pos, velocity: vel, life: maxLife, maxLife };
}

const TRAIL_PER_METEOR = 8;

export default function MeteorShower({ config }: MeteorShowerProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const totalInstances = config.count * TRAIL_PER_METEOR;

  const meteors = useRef<MeteorState[]>(
    Array.from({ length: config.count }, () => spawnMeteor(config.spawnRadius)),
  );

  const color = useMemo(() => new THREE.Color(config.color), [config.color]);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Trail history per meteor
  const trails = useRef<THREE.Vector3[][]>(
    Array.from({ length: config.count }, () =>
      Array.from({ length: TRAIL_PER_METEOR }, () => new THREE.Vector3()),
    ),
  );

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    for (let m = 0; m < config.count; m++) {
      const meteor = meteors.current[m];
      meteor.life -= delta;

      if (meteor.life <= 0) {
        // Respawn
        const fresh = spawnMeteor(config.spawnRadius);
        meteors.current[m] = fresh;
        // Reset trail
        for (let t = 0; t < TRAIL_PER_METEOR; t++) {
          trails.current[m][t].copy(fresh.position);
        }
        continue;
      }

      // Move meteor
      meteor.position.addScaledVector(meteor.velocity, delta);

      // Shift trail
      const trail = trails.current[m];
      for (let t = TRAIL_PER_METEOR - 1; t > 0; t--) {
        trail[t].copy(trail[t - 1]);
      }
      trail[0].copy(meteor.position);

      // Update instances
      const lifeFraction = meteor.life / meteor.maxLife;
      for (let t = 0; t < TRAIL_PER_METEOR; t++) {
        const idx = m * TRAIL_PER_METEOR + t;
        const trailFade = 1 - t / TRAIL_PER_METEOR;
        const scale = Math.max(0.01, trailFade * lifeFraction * 0.5);

        dummy.position.copy(trail[t]);
        dummy.scale.setScalar(scale);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(idx, dummy.matrix);
      }
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, totalInstances]}>
      <sphereGeometry args={[1, 4, 4]} />
      <meshBasicMaterial color={color} transparent opacity={0.7} />
    </instancedMesh>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /root/Cosmic-Engine/frontend && npx tsc --noEmit 2>&1 | head -20`

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/canvas/MeteorShower.tsx
git commit -m "feat: add MeteorShower component for recent activity"
```

---

## Task 7: Update Universe.tsx to Render All Celestial Bodies

**Files:**

- Modify: `frontend/src/components/canvas/Universe.tsx`

- [ ] **Step 1: Update Universe.tsx**

Replace the entire file content:

```tsx
'use client';

import { useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { useUniverseData } from '@/hooks/useUniverseData';
import { useCosmicStore } from '@/stores/cosmicStore';
import { useCameraFlyTo } from '@/hooks/useCameraFlyTo';
import LightingSystem from './LightingSystem';
import Galaxy from './Galaxy';
import Comet from './Comet';
import Wormhole from './Wormhole';
import Pulsar from './Pulsar';
import StarGate from './StarGate';
import MeteorShower from './MeteorShower';

interface UniverseProps {
  onPlanetClick?: (slug: string, worldPosition?: THREE.Vector3) => void;
  onGalaxyClick?: (slug: string) => void;
  visiblePlanets?: Set<string>;
}

export default function Universe({ onPlanetClick, onGalaxyClick, visiblePlanets }: UniverseProps) {
  const { galaxies, comets, wormholes, pulsar, starGates, meteorShower, loading, error } =
    useUniverseData();
  const setFocusedBody = useCosmicStore((s) => s.setFocusedBody);
  const { flyTo } = useCameraFlyTo();

  const galaxyLights = useMemo(
    () =>
      galaxies.map((g) => ({
        position: [g.position.x, g.position.y, g.position.z] as [number, number, number],
        color: g.colorScheme.primary,
      })),
    [galaxies],
  );

  const handlePlanetClick = useCallback(
    (slug: string, worldPosition: THREE.Vector3) => {
      setFocusedBody(slug);
      flyTo([worldPosition.x, worldPosition.y, worldPosition.z], slug, { offset: 15 });
      onPlanetClick?.(slug, worldPosition);
    },
    [setFocusedBody, flyTo, onPlanetClick],
  );

  const handleGalaxyClick = useCallback(
    (slug: string) => {
      setFocusedBody(slug);
      const galaxy = galaxies.find((g) => g.slug === slug);
      if (galaxy) {
        flyTo([galaxy.position.x, galaxy.position.y, galaxy.position.z], slug, {
          offset: 100,
          duration: 2,
        });
      }
      onGalaxyClick?.(slug);
    },
    [galaxies, setFocusedBody, flyTo, onGalaxyClick],
  );

  const handleCometClick = useCallback(
    (slug: string) => {
      setFocusedBody(slug);
    },
    [setFocusedBody],
  );

  const handleWormholeClick = useCallback((year: number) => {
    console.log('Wormhole clicked, year:', year);
    // TODO: navigate to archive/year
  }, []);

  const handlePulsarClick = useCallback(() => {
    setFocusedBody('pulsar');
    flyTo([pulsar.position.x, pulsar.position.y, pulsar.position.z], 'pulsar', {
      offset: 30,
      duration: 2,
    });
  }, [pulsar, setFocusedBody, flyTo]);

  const handleStarGateClick = useCallback((id: string) => {
    console.log('StarGate clicked:', id);
    // TODO: show preview card
  }, []);

  if (loading || error) return null;

  return (
    <>
      <LightingSystem galaxyLights={galaxyLights} />

      {/* Galaxies (contain black holes, stars, planets, satellites, asteroids) */}
      {galaxies.map((galaxy) => (
        <Galaxy
          key={galaxy.id}
          data={galaxy}
          onPlanetClick={handlePlanetClick}
          onGalaxyClick={handleGalaxyClick}
          visiblePlanets={visiblePlanets}
        />
      ))}

      {/* Comets (pinned articles) */}
      {comets.map((comet) => (
        <Comet key={comet.id} data={comet} onClick={handleCometClick} />
      ))}

      {/* Wormholes (archive entries) */}
      {wormholes.map((wh) => (
        <Wormhole key={wh.id} data={wh} onClick={handleWormholeClick} />
      ))}

      {/* Pulsar (about page) */}
      <Pulsar data={pulsar} onClick={handlePulsarClick} />

      {/* Star Gates (friend links) */}
      {starGates.map((sg) => (
        <StarGate key={sg.id} data={sg} onClick={handleStarGateClick} />
      ))}

      {/* Meteor Shower (ambient activity effect) */}
      <MeteorShower config={meteorShower} />
    </>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /root/Cosmic-Engine/frontend && npx tsc --noEmit 2>&1 | head -20`

- [ ] **Step 3: Start dev server and verify all celestial bodies render**

Run: `cd /root/Cosmic-Engine/frontend && pnpm dev`

Verify in browser at `http://localhost:3000`:

- 3 galaxies with black holes, stars, and orbiting planets ✓
- 2 comets with glowing heads and trails traveling along paths ✓
- 3 wormholes (purple torus + vortex portal) at scene edges ✓
- 1 pulsar (blue, spinning, polar jets) ✓
- 3 star gates (smaller rings with shimmer) scattered between galaxies ✓
- Meteor streaks appearing and fading across the scene ✓
- Existing elements still work: star field, nebulae, constellations ✓

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/canvas/Universe.tsx
git commit -m "feat: integrate all celestial bodies into Universe scene"
```

---

## Task 8: Loading Animation (太空主题)

**Files:**

- Modify: `frontend/src/components/ui/CosmicLoader.tsx` (verify it matches spec)

- [ ] **Step 1: Check existing CosmicLoader.tsx**

Read the file. If it's a simple spinner, enhance it with the particle-coalescence loading animation described in the UX spec. If it already matches, skip this task.

- [ ] **Step 2: Commit if changes made**

```bash
git add frontend/src/components/ui/CosmicLoader.tsx
git commit -m "feat: enhance cosmic loader with particle coalescence animation"
```

---

## Self-Review Checklist

- [x] All 5 new celestial types from PRD covered: Comet ✓, Wormhole ✓, Pulsar ✓, StarGate ✓, MeteorShower ✓
- [x] Mock data includes all types with realistic values ✓
- [x] Universe.tsx renders all components ✓
- [x] All components follow conventions: `useFrame` with delta, `useRef` for mutations, InstancedMesh for particles ✓
- [x] No `useState` in render loops ✓
- [x] GPU disposal needed? Only Wormhole has shader materials — uniforms are simple, no textures to dispose ✓
- [x] Type names consistent across files: CometData, WormholeData, PulsarData, StarGateData, MeteorShowerConfig ✓
- [x] Existing Galaxy/Star/Planet/BlackHole/Satellite/AsteroidBelt/TagNebula/Constellation unchanged ✓
