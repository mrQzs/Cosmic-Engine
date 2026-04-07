'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';

import * as THREE from 'three';
import { newtonRaphsonKepler, keplerPosition } from '@/utils/mathHelpers';
import Atmosphere from './Atmosphere';
import OrbitRing from './OrbitRing';
import SatelliteSwarm from './SatelliteSwarm';
import { useCommentStore } from '@/stores/commentStore';
import { useCosmicStore } from '@/stores/cosmicStore';
import { QualityLevel } from '@cosmic-engine/shared';
import { useAccessibility } from '@/hooks/useAccessibility';
import planetVertSource from '@/shaders/planetSurface.vert.glsl';
import planetFragSource from '@/shaders/planetSurface.frag.glsl';

const PLANET_SEGMENTS: Record<string, number> = {
  [QualityLevel.High]: 64,
  [QualityLevel.Medium]: 32,
  [QualityLevel.Low]: 16,
  [QualityLevel.UltraLow]: 16,
};

export interface PlanetProps {
  slug: string;
  title: string;
  /** Galaxy center position */
  galaxyPosition: [number, number, number];
  /** Physics params from backend */
  physics: {
    mass: number;
    orbitRadius: number;
    eccentricity: number;
    orbitInclination: number;
    phaseOffset: number;
    orbitalSpeed: number;
    textureSeed: number;
  };
  /** Aesthetics params from backend */
  aesthetics: {
    planetType: string;
    baseColorHSL: { h: number; s: number; l: number };
    atmosphereColor?: string | null;
    surfaceRoughness: number;
    hasRing: boolean;
    glowIntensity: number;
    noiseType: string;
  };
  /** Whether this planet is dimmed by a filter */
  dimmed?: boolean;
  /** Comment count for deciding whether to render satellites */
  commentCount?: number;
  onClick?: (worldPosition: THREE.Vector3) => void;
  onPointerOver?: () => void;
  onPointerOut?: () => void;
  onSatelliteClick?: (id: string, position: THREE.Vector3) => void;
  onSatelliteHover?: (id: string | null, position: THREE.Vector3 | null) => void;
}

/** Convert HSL (h:0-360, s:0-100, l:0-100) to THREE.Color */
function hslToColor(hsl: { h: number; s: number; l: number }): THREE.Color {
  return new THREE.Color().setHSL(hsl.h / 360, hsl.s / 100, hsl.l / 100);
}

export default function Planet({
  slug,
  title,
  galaxyPosition,
  physics,
  aesthetics,
  dimmed = false,
  commentCount = 0,
  onClick,
  onPointerOver,
  onPointerOut,
  onSatelliteClick,
  onSatelliteHover,
}: PlanetProps) {
  const { prefersReducedMotion } = useAccessibility();
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const emissiveBoost = useRef(0);
  const worldPosRef = useRef(new THREE.Vector3());

  const comments = useCommentStore((s) => s.comments);
  const pendingComments = useCommentStore((s) => s.pendingComments);
  const viewMode = useCosmicStore((s) => s.viewMode);
  const qualityLevel = useCosmicStore((s) => s.qualityLevel);

  const planetSize = useMemo(() => 0.6 + Math.log(physics.mass + 1) * 0.35, [physics.mass]);
  const segments = PLANET_SEGMENTS[qualityLevel] ?? 32;

  const baseColor = useMemo(() => hslToColor(aesthetics.baseColorHSL), [aesthetics.baseColorHSL]);

  const uniforms = useMemo(
    () => ({
      u_baseColor: { value: baseColor },
      u_surfaceRoughness: { value: aesthetics.surfaceRoughness },
      u_textureSeed: { value: physics.textureSeed },
      u_time: { value: 0 },
      u_glowIntensity: { value: aesthetics.glowIntensity },
      u_fadeProgress: { value: 0 },
    }),
    [baseColor, aesthetics.surfaceRoughness, physics.textureSeed, aesthetics.glowIntensity],
  );

  useFrame(({ clock }, delta) => {
    if (!groupRef.current) return;

    // Kepler orbit: compute mean anomaly from elapsed time
    const time = clock.elapsedTime;
    const M = physics.phaseOffset + time * physics.orbitalSpeed * 0.3;
    const E = newtonRaphsonKepler(M, physics.eccentricity);
    const [ox, oy] = keplerPosition(physics.orbitRadius, physics.eccentricity, E);

    // Apply inclination rotation
    const cosI = Math.cos(physics.orbitInclination);
    const sinI = Math.sin(physics.orbitInclination);
    const x = galaxyPosition[0] + ox;
    const y = galaxyPosition[1] + oy * sinI;
    const z = galaxyPosition[2] + oy * cosI;

    groupRef.current.position.set(x, y, z);
    worldPosRef.current.set(x, y, z);

    // Self-rotation (skip when user prefers reduced motion)
    if (meshRef.current && !prefersReducedMotion) {
      meshRef.current.rotation.y += delta * 0.2;
    }

    // Update shader uniforms
    uniforms.u_time.value = time;

    // Emissive boost on hover (smooth decay)
    emissiveBoost.current *= 1 - delta * 5;
    uniforms.u_glowIntensity.value = aesthetics.glowIntensity + emissiveBoost.current;
  });

  const handlePointerOver = () => {
    emissiveBoost.current = 0.4;
    onPointerOver?.();
  };

  const handlePointerOut = () => {
    onPointerOut?.();
  };

  return (
    <group ref={groupRef}>
      {/* Planet surface */}
      <mesh
        ref={meshRef}
        onClick={() => onClick?.(worldPosRef.current.clone())}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <sphereGeometry args={[planetSize, segments, segments]} />
        <shaderMaterial
          vertexShader={planetVertSource}
          fragmentShader={planetFragSource}
          uniforms={uniforms}
          transparent={dimmed}
          opacity={dimmed ? 0.15 : 1}
        />
      </mesh>

      {/* Atmosphere glow */}
      {aesthetics.atmosphereColor && (
        <Atmosphere radius={planetSize * 1.15} color={aesthetics.atmosphereColor} />
      )}

      {/* Ring system */}
      {aesthetics.hasRing && (
        <mesh rotation={[Math.PI * 0.4, 0, 0]}>
          <torusGeometry args={[planetSize * 2, planetSize * 0.15, 2, 64]} />
          <meshBasicMaterial color={baseColor} transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Orbit path visualization */}
      <OrbitRing
        semiMajorAxis={physics.orbitRadius}
        eccentricity={physics.eccentricity}
        inclination={physics.orbitInclination}
        centerOffset={galaxyPosition}
      />

      {/* Comment satellites */}
      {(viewMode === 'planet' || viewMode === 'article' || commentCount > 0) && (
        <SatelliteSwarm
          bodySlug={slug}
          comments={comments}
          pendingComments={pendingComments}
          planetWorldPosition={worldPosRef.current}
          onSatelliteClick={onSatelliteClick}
          onSatelliteHover={onSatelliteHover}
        />
      )}
    </group>
  );
}
