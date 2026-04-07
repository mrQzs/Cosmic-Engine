'use client';

import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useCosmicStore } from '@/stores/cosmicStore';
import { QualityLevel, STAR_PRESETS, type StarPresetParams } from '@cosmic-engine/shared';
import { hashString } from '@/utils/galaxyPhysics';
import starVertSource from '@/shaders/starSurface.vert.glsl';
import starFragSource from '@/shaders/starSurface.frag.glsl';
import starHaloVertSource from '@/shaders/starHalo.vert.glsl';
import starHaloFragSource from '@/shaders/starHalo.frag.glsl';
import prominenceFragSource from '@/shaders/starProminence.frag.glsl';
import prominenceVertSource from '@/shaders/starProminence.vert.glsl';

export interface StarProps {
  id: string;
  position: [number, number, number];
  starPhase: string;
  onClick?: () => void;
}

const _tmpVec = new THREE.Vector3();
const _tmpMat = new THREE.Matrix4();
const _tmpColor = new THREE.Color();

/** Simple hash for per-particle seeds */
function hash11(n: number): number {
  n = Math.sin(n) * 43758.5453123;
  return n - Math.floor(n);
}

// ============================================================
// Quality tier configs
// ============================================================

const GEO_DETAIL: Record<string, number> = {
  [QualityLevel.High]: 6,
  [QualityLevel.Medium]: 5,
  [QualityLevel.Low]: 4,
  [QualityLevel.UltraLow]: 3,
};

const CORONA_SCALE: Record<string, number> = {
  [QualityLevel.High]: 1.0,
  [QualityLevel.Medium]: 0.6,
  [QualityLevel.Low]: 0,
  [QualityLevel.UltraLow]: 0,
};

const PROMINENCE_COUNT: Record<string, number> = {
  [QualityLevel.High]: 3,
  [QualityLevel.Medium]: 2,
  [QualityLevel.Low]: 0,
  [QualityLevel.UltraLow]: 0,
};

const HALO_DETAIL: Record<string, number> = {
  [QualityLevel.High]: 5,
  [QualityLevel.Medium]: 5,
  [QualityLevel.Low]: 4,
  [QualityLevel.UltraLow]: 3,
};

// ============================================================
// Sub-component: Star Halo (Fresnel + noise-modulated shell)
// ============================================================

function StarHalo({
  preset,
  seed,
  qualityLevel,
  starScale,
}: {
  preset: StarPresetParams;
  seed: number;
  qualityLevel: string;
  starScale: number;
}) {
  const detail = HALO_DETAIL[qualityLevel] ?? 4;
  const useShader = qualityLevel !== QualityLevel.UltraLow;

  const uniforms = useMemo(
    () => ({
      u_time: { value: 0 },
      u_haloOpacity: { value: preset.haloOpacity },
      u_pulseSpeed: { value: preset.pulseSpeed },
      u_granulationScale: { value: preset.granulationScale },
      u_flowSpeed: { value: preset.flowSpeed },
      u_baseTemperature: { value: preset.baseTemperature },
      u_seed: { value: seed },
    }),
    [preset, seed],
  );

  const fallbackColor = useMemo(() => {
    const t = preset.baseTemperature;
    if (t < 4000) return '#ff8844';
    if (t < 7000) return '#ffcc88';
    return '#aabbff';
  }, [preset.baseTemperature]);

  useFrame(({ clock }) => {
    uniforms.u_time.value = clock.elapsedTime;
  });

  const scale = starScale * preset.haloScale;

  if (!useShader) {
    return (
      <mesh scale={[scale, scale, scale]}>
        <icosahedronGeometry args={[1, detail]} />
        <meshBasicMaterial
          color={fallbackColor}
          transparent
          opacity={preset.haloOpacity}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    );
  }

  return (
    <mesh scale={[scale, scale, scale]}>
      <icosahedronGeometry args={[1, detail]} />
      <shaderMaterial
        vertexShader={starHaloVertSource}
        fragmentShader={starHaloFragSource}
        uniforms={uniforms}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        side={THREE.DoubleSide}
        toneMapped={false}
      />
    </mesh>
  );
}

// ============================================================
// Sub-component: Corona Particles (InstancedMesh)
// ============================================================

function CoronaParticles({ preset, seed }: { preset: StarPresetParams; seed: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const count = preset.coronaParticleCount;

  // Pre-compute per-particle seeds (constant)
  const seeds = useMemo(() => {
    const arr = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
      const base = seed + i;
      arr[i * 4 + 0] = hash11(base + 0.17); // azimuth seed
      arr[i * 4 + 1] = hash11(base + 2.37); // elevation seed
      arr[i * 4 + 2] = hash11(base + 4.91); // speed variation
      arr[i * 4 + 3] = hash11(base + 9.13) * 0.7 + 0.3; // brightness weight
    }
    return arr;
  }, [count, seed]);

  const coronaColor = useMemo(() => {
    const t = preset.baseTemperature * 1.2;
    if (t < 4000) return new THREE.Color(1.0, 0.4, 0.1);
    if (t < 6000) return new THREE.Color(1.0, 0.7, 0.3);
    if (t < 8000) return new THREE.Color(1.0, 0.85, 0.6);
    return new THREE.Color(0.6, 0.75, 1.0);
  }, [preset.baseTemperature]);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const time = clock.elapsedTime;

    for (let i = 0; i < count; i++) {
      const si = i * 4;
      const sAz = seeds[si];
      const sEl = seeds[si + 1];
      const sSpd = seeds[si + 2];
      const sBrt = seeds[si + 3];

      // Orbital animation
      const azimuth = sAz * Math.PI * 2 + time * preset.particleSpeed * (sSpd * 1.8 + 0.5);
      const elevation = (sEl - 0.5) * Math.PI;

      // Direction on sphere
      const cosEl = Math.cos(elevation);
      const dx = Math.cos(azimuth) * cosEl;
      const dy = Math.sin(elevation);
      const dz = Math.sin(azimuth) * cosEl;

      // Magnetic bias towards equator
      const magneticBias = Math.pow(1 - Math.abs(dy), 1.5) * 0.22;

      // Breathing + flicker
      const breathing =
        Math.sin(time * preset.pulseSpeed * (sSpd * 1.6 + 0.5) + sAz * 26.0) * 0.5 + 0.5;
      const flicker = Math.sin(time * preset.particleSpeed * 3.0 + sEl * 41.0) * 0.5 + 0.5;

      // Radial distance
      const orbitJitter = Math.sin(azimuth * 3.0 + time * 0.4) * 0.12;
      const radius =
        preset.particleShell +
        sSpd * preset.particleAmplitude +
        breathing * preset.particleAmplitude * 0.45 +
        magneticBias +
        orbitJitter;

      const px = dx * radius;
      const py = dy * radius;
      const pz = dz * radius;

      // Intensity
      const intensity = (breathing * 0.38 + flicker * 0.22) * sBrt * preset.particleIntensity;

      // Set matrix
      const s = sBrt * preset.particleSize;
      _tmpMat.makeScale(s, s, s);
      _tmpMat.setPosition(px, py, pz);
      mesh.setMatrixAt(i, _tmpMat);

      // Set color
      _tmpColor.copy(coronaColor).multiplyScalar(intensity + 0.2);
      mesh.setColorAt(i, _tmpColor);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} renderOrder={3}>
      <icosahedronGeometry args={[1, 1]} />
      <meshBasicMaterial
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </instancedMesh>
  );
}

// ============================================================
// Sub-component: Prominence Arcs (TubeGeometry + shader)
// ============================================================

function ProminenceArcs({
  preset,
  seed,
  arcCount,
}: {
  preset: StarPresetParams;
  seed: number;
  arcCount: number;
}) {
  const arcsData = useMemo(() => {
    const arcs: Array<{
      geometry: THREE.TubeGeometry;
      uniforms: Record<string, THREE.IUniform>;
    }> = [];

    for (let i = 0; i < arcCount; i++) {
      const h = hash11(seed + i * 7.31);
      const h2 = hash11(seed + i * 13.17);
      const h3 = hash11(seed + i * 19.53);

      // Arc endpoints on star surface (unit sphere)
      const az1 = h * Math.PI * 2;
      const az2 = az1 + 0.4 + h2 * 0.5;
      const el = (h3 - 0.5) * 0.4;

      const r = 1.0; // unit sphere
      const p0 = new THREE.Vector3(
        Math.cos(az1) * Math.cos(el) * r,
        Math.sin(el) * r,
        Math.sin(az1) * Math.cos(el) * r,
      );
      const p3 = new THREE.Vector3(
        Math.cos(az2) * Math.cos(el + (h2 - 0.5) * 0.3) * r,
        Math.sin(el + (h2 - 0.5) * 0.3) * r,
        Math.sin(az2) * Math.cos(el + (h2 - 0.5) * 0.3) * r,
      );

      // Control points raised above surface
      const peakHeight = 1.3 + h * 0.5; // 1.3–1.8× radius
      const mid = p0.clone().add(p3).multiplyScalar(0.5).normalize().multiplyScalar(peakHeight);
      const p1 = p0
        .clone()
        .lerp(mid, 0.4)
        .normalize()
        .multiplyScalar(peakHeight * 0.9);
      const p2 = p3
        .clone()
        .lerp(mid, 0.4)
        .normalize()
        .multiplyScalar(peakHeight * 0.9);

      const curve = new THREE.CubicBezierCurve3(p0, p1, p2, p3);
      const tubeRadius = 0.025 + h2 * 0.02;
      const geometry = new THREE.TubeGeometry(curve, 48, tubeRadius, 4, false);

      const uniforms = {
        u_time: { value: 0 },
        u_arcIndex: { value: i },
        u_prominenceSpeed: { value: preset.prominenceSpeed },
        u_prominenceIntensity: { value: preset.prominenceIntensity },
        u_prominenceTemp: { value: preset.prominenceTemp },
      };

      arcs.push({ geometry, uniforms });
    }
    return arcs;
  }, [seed, arcCount, preset]);

  useFrame(({ clock }) => {
    for (const arc of arcsData) {
      arc.uniforms.u_time.value = clock.elapsedTime;
    }
  });

  // Dispose geometries on unmount
  useEffect(() => {
    return () => {
      for (const arc of arcsData) {
        arc.geometry.dispose();
      }
    };
  }, [arcsData]);

  return (
    <>
      {arcsData.map((arc, i) => (
        <mesh key={i} geometry={arc.geometry} renderOrder={1}>
          <shaderMaterial
            vertexShader={prominenceVertSource}
            fragmentShader={prominenceFragSource}
            uniforms={arc.uniforms}
            transparent
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </mesh>
      ))}
    </>
  );
}

// ============================================================
// Main Star component
// ============================================================

export default function Star({ id, position, starPhase, onClick }: StarProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();
  const qualityLevel = useCosmicStore((s) => s.qualityLevel);

  const preset = STAR_PRESETS[starPhase] ?? STAR_PRESETS.MAIN_SEQUENCE;
  const seed = useMemo(() => hashString(id), [id]);
  const detail = GEO_DETAIL[qualityLevel] ?? 4;
  const coronaScale = CORONA_SCALE[qualityLevel] ?? 0;
  const maxProminences = PROMINENCE_COUNT[qualityLevel] ?? 0;
  const actualProminences = Math.min(preset.prominenceCount, maxProminences);

  const lowQuality = qualityLevel === QualityLevel.Low || qualityLevel === QualityLevel.UltraLow;

  const uniforms = useMemo(
    () => ({
      u_time: { value: 0 },
      u_seed: { value: seed },
      u_pixelSize: { value: 0.01 },
      u_baseTemperature: { value: preset.baseTemperature },
      u_temperatureRange: { value: preset.temperatureRange },
      u_granulationScale: { value: preset.granulationScale },
      u_flowSpeed: { value: preset.flowSpeed },
      u_displacement: { value: lowQuality ? 0 : preset.displacement },
      u_spotScale: { value: preset.spotScale },
      u_umbraThreshold: { value: preset.spotUmbraThreshold },
      u_penumbraThreshold: { value: preset.spotPenumbraThreshold },
      u_umbraDropK: { value: preset.spotUmbraDropK },
      u_penumbraDropK: { value: preset.spotPenumbraDropK },
      u_limbDarkeningStrength: { value: preset.limbDarkeningStrength },
      u_pulseSpeed: { value: preset.pulseSpeed },
      u_pulseAmount: { value: preset.pulseAmount },
      u_rimPower: { value: preset.rimPower },
      u_rimBoost: { value: preset.rimBoost },
    }),
    [preset, seed, lowQuality],
  );

  useFrame(({ clock }) => {
    uniforms.u_time.value = clock.elapsedTime;
    if (meshRef.current) {
      const dist = camera.position.distanceTo(meshRef.current.getWorldPosition(_tmpVec));
      uniforms.u_pixelSize.value = preset.starScale / Math.max(dist, 1);
    }
  });

  const coronaCount = coronaScale > 0 ? Math.round(preset.coronaParticleCount * coronaScale) : 0;
  const coronaPreset = useMemo(
    () =>
      coronaCount !== preset.coronaParticleCount
        ? { ...preset, coronaParticleCount: coronaCount }
        : preset,
    [preset, coronaCount],
  );

  return (
    <group position={position} onClick={onClick}>
      {/* Star core with procedural surface shader */}
      <mesh ref={meshRef} scale={[preset.starScale, preset.starScale, preset.starScale]}>
        <icosahedronGeometry args={[1, detail]} />
        <shaderMaterial
          vertexShader={starVertSource}
          fragmentShader={starFragSource}
          uniforms={uniforms}
          toneMapped={false}
        />
      </mesh>

      {/* Halo shell (scale includes starScale) */}
      <StarHalo
        preset={preset}
        seed={seed}
        qualityLevel={qualityLevel}
        starScale={preset.starScale}
      />

      {/* Corona + Prominence share starScale via parent group */}
      <group scale={[preset.starScale, preset.starScale, preset.starScale]}>
        {/* Corona particles */}
        {coronaCount > 0 && <CoronaParticles preset={coronaPreset} seed={seed} />}

        {/* Prominence arcs */}
        {actualProminences > 0 && (
          <ProminenceArcs preset={preset} seed={seed} arcCount={actualProminences} />
        )}
      </group>
    </group>
  );
}
