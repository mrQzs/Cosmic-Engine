'use client';

import { useRef, useMemo, useEffect, useCallback } from 'react';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';

import { LOD } from '@/config/universeLayout';
import { useCosmicStore } from '@/stores/cosmicStore';
import { QualityLevel } from '@cosmic-engine/shared';
import { useAccessibility } from '@/hooks/useAccessibility';
import Planet from './Planet';
import BlackHole from './BlackHole';
import Star from './Star';
import type { GalaxyData } from '@/hooks/useUniverseData';
import {
  mulberry32,
  hashString,
  sampleExponentialDisk,
  sampleSersicBulge,
  sampleVerticalSech2,
  distToNearestArm,
  densityWaveEnhancement,
  sampleStarTemperature,
  temperatureToRGB,
  uniformRandomQuaternion,
} from '@/utils/galaxyPhysics';
import { createCloudTexture } from '@/utils/proceduralTextures';
import dustVertSource from '@/shaders/dustCloud.vert.glsl';
import dustFragSource from '@/shaders/dustCloud.frag.glsl';

interface GalaxyProps {
  data: GalaxyData;
  onPlanetClick?: (slug: string, worldPosition: THREE.Vector3) => void;
  onGalaxyClick?: (slug: string) => void;
  visiblePlanets?: Set<string>;
}

// ---- Physical parameters ----
const ARM_COUNT = 2;
const PITCH_ANGLE = 0.22; // ~12.6° — typical Sb/Sc spiral
const GALAXY_RADIUS = 200; // 场景单位 (expanded for better close-up detail)
const DISK_SCALE_LENGTH = GALAXY_RADIUS / 3.5; // Freeman disk: ~1/3.5 of visible radius
const DISK_SCALE_HEIGHT = 10; // Thin disk z₀
const BULGE_EFFECTIVE_RADIUS = 18;
const BULGE_SERSIC_N = 4; // de Vaucouleurs profile
const ARM_WIDTH = 10; // Density wave arm width

const DISK_STARS = 1400;
const BULGE_STARS = 500;

// Quality-dependent dust particle counts (P2: texture upgrade)
const DUST_COUNTS: Record<string, number> = {
  [QualityLevel.High]: 2000,
  [QualityLevel.Medium]: 1200,
  [QualityLevel.Low]: 800,
  [QualityLevel.UltraLow]: 400,
};

const DISK_SEGMENTS: Record<string, number> = {
  [QualityLevel.High]: 6,
  [QualityLevel.Medium]: 4,
  [QualityLevel.Low]: 4,
  [QualityLevel.UltraLow]: 4,
};
const BULGE_SEGMENTS: Record<string, number> = {
  [QualityLevel.High]: 8,
  [QualityLevel.Medium]: 6,
  [QualityLevel.Low]: 4,
  [QualityLevel.UltraLow]: 4,
};

// Differential rotation parameters (P1)
const BASE_DISK_SPEED = 0.015; // Base angular velocity at center
const BASE_DUST_SPEED = 0.025; // Dust rotates faster (density wave pattern speed)
const DIFF_ROT_K = 3.0; // Falloff factor: ω = base / (1 + r/R × k)

// Mouse interaction parameters (P3)
// Black hole visual exclusion zone — no stars generated inside this radius
const BH_EXCLUSION_RADIUS = 25;

const MOUSE_RADIUS = 35; // Force field radius in scene units
const MOUSE_FORCE = 18; // Repulsion strength
const SPRING_K_DISK = 2.0; // Spring restoration for disk stars
const SPRING_K_DUST = 1.0; // Weaker spring for dust (more fluid)
const DAMPING_PER_SEC = 0.16; // Target: ~16% remaining after 1 second
const MAX_DELTA = 0.05; // Clamp delta to prevent spring instability on lag spikes

const _dummy = new THREE.Object3D();
const _color = new THREE.Color();
const _tmpVec = new THREE.Vector3();
const _localMouse = new THREE.Vector3();

export default function Galaxy({
  data,
  onPlanetClick,
  onGalaxyClick,
  visiblePlanets,
}: GalaxyProps) {
  const groupRef = useRef<THREE.Group>(null);
  const diskRef = useRef<THREE.InstancedMesh>(null);
  const bulgeRef = useRef<THREE.InstancedMesh>(null);
  const dustRef = useRef<THREE.Points>(null);
  const lodRef = useRef<'far' | 'mid' | 'near'>('far');
  const { camera } = useThree();
  const qualityLevel = useCosmicStore((s) => s.qualityLevel);
  const diskSegs = DISK_SEGMENTS[qualityLevel] ?? 4;
  const bulgeSegs = BULGE_SEGMENTS[qualityLevel] ?? 6;
  const dustCount = DUST_COUNTS[qualityLevel] ?? 800;

  const { prefersReducedMotion } = useAccessibility();
  const { x: gx, y: gy, z: gz } = data.position;
  const galaxyPos = useMemo<[number, number, number]>(() => [gx, gy, gz], [gx, gy, gz]);
  const galaxyVec = useMemo(() => new THREE.Vector3(gx, gy, gz), [gx, gy, gz]);
  const nebulaColor = useMemo(
    () => new THREE.Color(data.colorScheme.nebula),
    [data.colorScheme.nebula],
  );

  // Deterministic PRNG from galaxy slug
  const seed = useMemo(() => hashString(data.slug), [data.slug]);

  // ---- SO(3) uniform random orientation per galaxy ----
  const orientation = useMemo(() => {
    const rand = mulberry32(seed);
    const [qx, qy, qz, qw] = uniformRandomQuaternion(rand);
    return new THREE.Quaternion(qx, qy, qz, qw);
  }, [seed]);

  const eulerRotation = useMemo(() => {
    const euler = new THREE.Euler().setFromQuaternion(orientation);
    return [euler.x, euler.y, euler.z] as [number, number, number];
  }, [orientation]);

  // ---- Per-particle data for differential rotation + mouse interaction ----

  // Disk stars: [r, theta, z, scale] per star (polar coords, theta updated each frame)
  const diskPolar = useMemo(() => new Float32Array(DISK_STARS * 4), []);
  // Disk dynamics: [offsetX, offsetY, offsetZ, vx, vy, vz] per star
  const diskDynamics = useMemo(() => new Float32Array(DISK_STARS * 6), []);

  // Dust: [r, theta, z] per particle
  const dustPolar = useMemo(() => new Float32Array(dustCount * 3), [dustCount]);
  // Dust dynamics: [offsetX, offsetY, offsetZ, vx, vy, vz] per particle
  const dustDynamics = useMemo(() => new Float32Array(dustCount * 6), [dustCount]);

  // Mouse interaction state
  const mouseRef = useRef(new THREE.Vector3());
  const mouseActiveRef = useRef(false);
  const lastPointerRef = useRef(0);

  // Cloud texture for dust particles (P2)
  const cloudTexture = useMemo(() => createCloudTexture(128), []);
  useEffect(
    () => () => {
      cloudTexture.dispose();
    },
    [cloudTexture],
  );

  // Custom dust ShaderMaterial: reads per-particle 'size' attribute (M3 fix)
  const dustMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: dustVertSource,
        fragmentShader: dustFragSource,
        uniforms: {
          uCloudMap: { value: cloudTexture },
          uOpacity: { value: 0.4 },
        },
        vertexColors: true,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [cloudTexture],
  );
  useEffect(
    () => () => {
      dustMaterial.dispose();
    },
    [dustMaterial],
  );

  // ---- Disk stars: exponential profile + density wave spiral arms ----
  useEffect(() => {
    if (!diskRef.current) return;
    // Reset dynamics on regeneration to prevent stale offsets (m2)
    diskDynamics.fill(0);
    const mesh = diskRef.current;
    const rand = mulberry32(seed + 1);

    for (let i = 0; i < DISK_STARS; i++) {
      let r = sampleExponentialDisk(rand, DISK_SCALE_LENGTH);
      // Push stars out of the black hole exclusion zone
      if (r < BH_EXCLUSION_RADIUS) r += BH_EXCLUSION_RADIUS;
      const theta = rand() * Math.PI * 2;
      const z = sampleVerticalSech2(rand, DISK_SCALE_HEIGHT);

      // Density wave: enhance probability near arms
      const armDist = distToNearestArm(r, theta, ARM_COUNT, PITCH_ANGLE, GALAXY_RADIUS);
      const enhancement = densityWaveEnhancement(armDist, ARM_WIDTH);

      if (rand() > enhancement / 3) {
        // Dimmer inter-arm star
      }

      const x = r * Math.cos(theta);
      const y = z;
      const zPos = r * Math.sin(theta);

      // Star size: brighter near arms
      const onArmFactor = Math.max(0, 1 - armDist / (ARM_WIDTH * 2));
      const baseSize = 0.1 + rand() * 0.25;
      const size = baseSize * (0.6 + onArmFactor * 0.8);

      // Store polar data for differential rotation
      const pi = i * 4;
      diskPolar[pi] = r;
      diskPolar[pi + 1] = theta;
      diskPolar[pi + 2] = z;
      diskPolar[pi + 3] = size;

      _dummy.position.set(x, y, zPos);
      _dummy.scale.setScalar(size);
      _dummy.updateMatrix();
      mesh.setMatrixAt(i, _dummy.matrix);

      // Color from HR diagram + P1 density brightness enhancement
      const temp = sampleStarTemperature(rand, r, GALAXY_RADIUS, onArmFactor);
      const rgb = temperatureToRGB(temp);
      // Boost brightness near spiral arms (×1.0 to ×1.5)
      const brightnessBoost = 1.0 + onArmFactor * 0.5;
      _color.setRGB(
        Math.min(1, rgb.r * brightnessBoost),
        Math.min(1, rgb.g * brightnessBoost),
        Math.min(1, rgb.b * brightnessBoost),
      );
      mesh.setColorAt(i, _color);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, diskPolar]);

  // ---- Bulge stars: Sérsic n=4 (de Vaucouleurs) profile ----
  useEffect(() => {
    if (!bulgeRef.current) return;
    const mesh = bulgeRef.current;
    const rand = mulberry32(seed + 2);

    for (let i = 0; i < BULGE_STARS; i++) {
      let r = sampleSersicBulge(rand, BULGE_EFFECTIVE_RADIUS, BULGE_SERSIC_N);
      // Push bulge stars out of the black hole exclusion zone
      if (r < BH_EXCLUSION_RADIUS) r += BH_EXCLUSION_RADIUS;
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(2 * rand() - 1);

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta) * 0.6; // Oblate
      const zPos = r * Math.cos(phi);

      const temp = 3500 + rand() * 4000;
      const rgb = temperatureToRGB(temp);
      _color.setRGB(rgb.r, rgb.g, rgb.b);

      const size = 0.15 + rand() * 0.4 * (1 - r / (BULGE_EFFECTIVE_RADIUS * 4));

      _dummy.position.set(x, y, zPos);
      _dummy.scale.setScalar(size);
      _dummy.updateMatrix();
      mesh.setMatrixAt(i, _dummy.matrix);
      mesh.setColorAt(i, _color);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [seed]);

  // ---- Dust / emission nebulae along spiral arms (P2: cloud texture upgrade) ----
  const dustGeometry = useMemo(() => {
    // Reset dynamics on regeneration to prevent stale offsets (m2)
    dustDynamics.fill(0);
    const rand = mulberry32(seed + 3);
    const positions = new Float32Array(dustCount * 3);
    const colors = new Float32Array(dustCount * 3);
    const sizes = new Float32Array(dustCount);

    for (let i = 0; i < dustCount; i++) {
      let r = sampleExponentialDisk(rand, DISK_SCALE_LENGTH * 1.2);
      if (r < BH_EXCLUSION_RADIUS) r += BH_EXCLUSION_RADIUS;
      const theta = rand() * Math.PI * 2;
      const z = sampleVerticalSech2(rand, DISK_SCALE_HEIGHT * 0.7);

      // Strongly concentrate on arms
      const armDist = distToNearestArm(r, theta, ARM_COUNT, PITCH_ANGLE, GALAXY_RADIUS);
      const onArm = Math.exp(-(armDist * armDist) / (ARM_WIDTH * ARM_WIDTH * 2));

      if (rand() > onArm * 0.8 + 0.1) {
        positions[i * 3] = 0;
        positions[i * 3 + 1] = 0;
        positions[i * 3 + 2] = 0;
        sizes[i] = 0;
        // Store zero radius so differential rotation skips it
        dustPolar[i * 3] = 0;
        dustPolar[i * 3 + 1] = 0;
        dustPolar[i * 3 + 2] = 0;
        continue;
      }

      const x = r * Math.cos(theta);
      const zPos = r * Math.sin(theta);

      positions[i * 3] = x;
      positions[i * 3 + 1] = z;
      positions[i * 3 + 2] = zPos;

      // Store polar data for differential rotation
      dustPolar[i * 3] = r;
      dustPolar[i * 3 + 1] = theta;
      dustPolar[i * 3 + 2] = z;

      // Nebula color: brighter near center, dimmer at edges (P2 density gradient)
      const rNorm = r / GALAXY_RADIUS;
      const edgeFade = 1.0 - rNorm * 0.5;
      _color.copy(nebulaColor);
      _color.offsetHSL(rand() * 0.08 - 0.04, 0, rand() * 0.15 - 0.075);
      _color.multiplyScalar(edgeFade);
      colors[i * 3] = _color.r;
      colors[i * 3 + 1] = _color.g;
      colors[i * 3 + 2] = _color.b;

      // Larger sizes for denser regions, smaller at edges
      const densitySize = 2.0 + onArm * 3.0 + rand() * 2.0;
      sizes[i] = densitySize;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    return geo;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, nebulaColor, dustCount, dustPolar]);

  useEffect(() => {
    return () => {
      dustGeometry.dispose();
    };
  }, [dustGeometry]);

  // ---- Named star children (subcategories) placed along spiral arms ----
  const starPhaseConfig = useMemo(() => {
    const rand = mulberry32(seed + 4);
    return (data.children ?? []).map((star, idx) => {
      const arm = idx % ARM_COUNT;
      const armPhase = (arm / ARM_COUNT) * Math.PI * 2;
      const r = 80 + idx * 25 + rand() * 10;
      const b = 1 / Math.tan(PITCH_ANGLE);
      const a = GALAXY_RADIUS * 0.05;
      const theta = Math.log(r / a) / b + armPhase;

      return {
        ...star,
        starPhase: star.starPhase || 'MAIN_SEQUENCE',
        position: [r * Math.cos(theta), (rand() - 0.5) * 2, r * Math.sin(theta)] as [
          number,
          number,
          number,
        ],
      };
    });
  }, [data.children, seed]);

  // ---- Mouse interaction: throttled pointer handler (P3) ----
  const handlePointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    const now = performance.now();
    // Throttle to ~30fps as per CLAUDE.md raycast policy
    if (now - lastPointerRef.current < 33) return;
    lastPointerRef.current = now;

    if (!groupRef.current || !e.point) return;

    // Convert to galaxy local space
    groupRef.current.worldToLocal(_localMouse.copy(e.point));
    mouseRef.current.copy(_localMouse);
    mouseActiveRef.current = true;
  }, []);

  const handlePointerLeave = useCallback(() => {
    mouseActiveRef.current = false;
  }, []);

  // ---- Frame animation: differential rotation + mouse forces ----
  useFrame((_, rawDelta) => {
    if (!groupRef.current) return;

    // Clamp delta to prevent spring instability on lag spikes (m3)
    const delta = Math.min(rawDelta, MAX_DELTA);
    // Frame-rate-independent damping: DAMPING_PER_SEC^(delta) (M1 fix)
    const damping = Math.pow(DAMPING_PER_SEC, delta);

    const dist = camera.position.distanceTo(galaxyVec);
    if (dist > LOD.galaxyFar) lodRef.current = 'far';
    else if (dist > LOD.galaxyMid) lodRef.current = 'mid';
    else lodRef.current = 'near';

    const mouseActive = mouseActiveRef.current && !prefersReducedMotion;
    const mx = mouseRef.current.x;
    const mz = mouseRef.current.z;

    // ---- Disk stars: per-instance differential rotation + mouse interaction ----
    if (diskRef.current) {
      const mesh = diskRef.current;
      // Reset quaternion to identity so sphere matrices are clean (m1)
      _dummy.quaternion.identity();

      for (let i = 0; i < DISK_STARS; i++) {
        const pi = i * 4;
        const r = diskPolar[pi];
        if (r < 0.1) continue; // Skip degenerate

        // Differential rotation: inner regions rotate faster
        const omega = BASE_DISK_SPEED / (1 + (r / GALAXY_RADIUS) * DIFF_ROT_K);
        diskPolar[pi + 1] += delta * omega;

        const theta = diskPolar[pi + 1];
        const z = diskPolar[pi + 2];
        const scale = diskPolar[pi + 3];

        // Home position (rotating with differential speed)
        const hx = r * Math.cos(theta);
        const hy = z;
        const hz = r * Math.sin(theta);

        const di = i * 6;

        // Mouse repulsion force
        if (mouseActive) {
          const cx = hx + diskDynamics[di];
          const cz = hz + diskDynamics[di + 2];
          const dx = cx - mx;
          const dz = cz - mz;
          const md = Math.sqrt(dx * dx + dz * dz);
          if (md < MOUSE_RADIUS && md > 0.1) {
            const force = (1 - md / MOUSE_RADIUS) * MOUSE_FORCE;
            diskDynamics[di + 3] += (dx / md) * force * delta; // vx
            diskDynamics[di + 5] += (dz / md) * force * delta; // vz
          }
        }

        // Spring restoration toward home
        diskDynamics[di + 3] += -diskDynamics[di] * SPRING_K_DISK * delta;
        diskDynamics[di + 4] += -diskDynamics[di + 1] * SPRING_K_DISK * delta;
        diskDynamics[di + 5] += -diskDynamics[di + 2] * SPRING_K_DISK * delta;

        // Frame-rate-independent damping
        diskDynamics[di + 3] *= damping;
        diskDynamics[di + 4] *= damping;
        diskDynamics[di + 5] *= damping;

        // Update offsets
        diskDynamics[di] += diskDynamics[di + 3] * delta;
        diskDynamics[di + 1] += diskDynamics[di + 4] * delta;
        diskDynamics[di + 2] += diskDynamics[di + 5] * delta;

        // Final position = home + offset
        _dummy.position.set(
          hx + diskDynamics[di],
          hy + diskDynamics[di + 1],
          hz + diskDynamics[di + 2],
        );
        _dummy.scale.setScalar(scale);
        _dummy.updateMatrix();
        mesh.setMatrixAt(i, _dummy.matrix);
      }

      mesh.instanceMatrix.needsUpdate = true;
    }

    // ---- Bulge: keep rigid rotation (spherical, no spiral structure) ----
    if (bulgeRef.current) bulgeRef.current.rotation.y += delta * 0.006;

    // ---- Dust: per-particle differential rotation + mouse interaction ----
    if (dustRef.current) {
      const posAttr = dustRef.current.geometry.getAttribute('position') as THREE.BufferAttribute;

      for (let i = 0; i < dustCount; i++) {
        const pi = i * 3;
        const r = dustPolar[pi];
        if (r < 0.1) continue; // Skip invisible particles

        // Differential rotation (faster than disk — density wave pattern speed)
        const omega = BASE_DUST_SPEED / (1 + (r / GALAXY_RADIUS) * DIFF_ROT_K);
        dustPolar[pi + 1] += delta * omega;

        const theta = dustPolar[pi + 1];
        const z = dustPolar[pi + 2];

        // Home position
        const hx = r * Math.cos(theta);
        const hy = z;
        const hz = r * Math.sin(theta);

        const di = i * 6;

        // Mouse repulsion
        if (mouseActive) {
          const cx = hx + dustDynamics[di];
          const cz = hz + dustDynamics[di + 2];
          const dx = cx - mx;
          const dz = cz - mz;
          const md = Math.sqrt(dx * dx + dz * dz);
          if (md < MOUSE_RADIUS && md > 0.1) {
            const force = (1 - md / MOUSE_RADIUS) * MOUSE_FORCE;
            dustDynamics[di + 3] += (dx / md) * force * delta;
            dustDynamics[di + 5] += (dz / md) * force * delta;
          }
        }

        // Spring restoration (weaker for dust — more fluid)
        dustDynamics[di + 3] += -dustDynamics[di] * SPRING_K_DUST * delta;
        dustDynamics[di + 4] += -dustDynamics[di + 1] * SPRING_K_DUST * delta;
        dustDynamics[di + 5] += -dustDynamics[di + 2] * SPRING_K_DUST * delta;

        // Frame-rate-independent damping
        dustDynamics[di + 3] *= damping;
        dustDynamics[di + 4] *= damping;
        dustDynamics[di + 5] *= damping;

        // Update offsets
        dustDynamics[di] += dustDynamics[di + 3] * delta;
        dustDynamics[di + 1] += dustDynamics[di + 4] * delta;
        dustDynamics[di + 2] += dustDynamics[di + 5] * delta;

        // Final position
        posAttr.setXYZ(
          i,
          hx + dustDynamics[di],
          hy + dustDynamics[di + 1],
          hz + dustDynamics[di + 2],
        );
      }

      posAttr.needsUpdate = true;
    }
  });

  const planets = data.bodies ?? [];

  return (
    <group ref={groupRef} position={galaxyPos} rotation={eulerRotation}>
      {/* Interaction plane for mouse force field — aligned to XZ disk plane,
          visually transparent but visible=true so R3F pointer events fire */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        <planeGeometry args={[GALAXY_RADIUS * 2.5, GALAXY_RADIUS * 2.5]} />
        <meshBasicMaterial transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

      {/* Supermassive black hole at center */}
      <BlackHole
        accentColor={data.colorScheme.primary}
        radius={35}
        onClick={() => onGalaxyClick?.(data.slug)}
      />

      {/* Bulge: Sérsic n=4 profile, old stellar population */}
      <instancedMesh ref={bulgeRef} args={[undefined, undefined, BULGE_STARS]}>
        <sphereGeometry args={[1, bulgeSegs, bulgeSegs]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>

      {/* Disk: exponential + spiral density wave, HR-diagram colors */}
      <instancedMesh ref={diskRef} args={[undefined, undefined, DISK_STARS]}>
        <sphereGeometry args={[1, diskSegs, diskSegs]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>

      {/* Dust / emission nebulae with cloud texture + per-particle size (P2 upgrade) */}
      <points ref={dustRef} geometry={dustGeometry} material={dustMaterial} />

      {/* Named stars (subcategory markers) with full star rendering */}
      {starPhaseConfig.map((star) => (
        <Star key={star.id} id={star.id} position={star.position} starPhase={star.starPhase} />
      ))}

      {/* Planets (articles) on Kepler orbits */}
      {planets.map((planet) => (
        <Planet
          key={planet.id}
          slug={planet.slug}
          title={planet.title}
          galaxyPosition={[0, 0, 0]}
          physics={planet.physicsParams}
          aesthetics={planet.aestheticsParams}
          commentCount={planet.commentCount}
          dimmed={visiblePlanets !== undefined && !visiblePlanets.has(planet.slug)}
          onClick={(pos) => onPlanetClick?.(planet.slug, pos)}
        />
      ))}
    </group>
  );
}
