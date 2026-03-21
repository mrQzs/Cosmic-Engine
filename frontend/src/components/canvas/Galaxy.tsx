'use client';

import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { LOD } from '@/config/universeLayout';
import Planet from './Planet';
import BlackHole from './BlackHole';
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

interface GalaxyProps {
  data: GalaxyData;
  onPlanetClick?: (slug: string) => void;
  onGalaxyClick?: (slug: string) => void;
  visiblePlanets?: Set<string>;
}

// ---- Physical parameters ----
const ARM_COUNT = 2;
const PITCH_ANGLE = 0.22; // ~12.6° — typical Sb/Sc spiral
const GALAXY_RADIUS = 70; // 场景单位
const DISK_SCALE_LENGTH = GALAXY_RADIUS / 3.5; // Freeman disk: ~1/3.5 of visible radius
const DISK_SCALE_HEIGHT = 1.5; // Thin disk z₀
const BULGE_EFFECTIVE_RADIUS = 8;
const BULGE_SERSIC_N = 4; // de Vaucouleurs profile
const ARM_WIDTH = 5; // Density wave arm width

const DISK_STARS = 1400;
const BULGE_STARS = 500;
const DUST_PARTICLES = 800;

const _dummy = new THREE.Object3D();
const _color = new THREE.Color();

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

  // ---- Disk stars: exponential profile + density wave spiral arms ----
  useEffect(() => {
    if (!diskRef.current) return;
    const mesh = diskRef.current;
    const rand = mulberry32(seed + 1);

    for (let i = 0; i < DISK_STARS; i++) {
      // Sample radial position from exponential disk
      const r = sampleExponentialDisk(rand, DISK_SCALE_LENGTH);

      // Random azimuthal angle
      const theta = rand() * Math.PI * 2;

      // Vertical sech² distribution
      const z = sampleVerticalSech2(rand, DISK_SCALE_HEIGHT);

      // Density wave: enhance probability near arms
      const armDist = distToNearestArm(r, theta, ARM_COUNT, PITCH_ANGLE, GALAXY_RADIUS);
      const enhancement = densityWaveEnhancement(armDist, ARM_WIDTH);

      // Rejection sampling based on arm enhancement
      if (rand() > enhancement / 3) {
        // Re-sample this star (skip if not dense enough)
        // Instead of skipping, place it but make it dimmer
      }

      const x = r * Math.cos(theta);
      const y = z;
      const zPos = r * Math.sin(theta);

      // Star size: brighter near arms, dimmer inter-arm
      const onArmFactor = Math.max(0, 1 - armDist / (ARM_WIDTH * 2));
      const baseSize = 0.1 + rand() * 0.25;
      const size = baseSize * (0.6 + onArmFactor * 0.8);

      _dummy.position.set(x, y, zPos);
      _dummy.scale.setScalar(size);
      _dummy.updateMatrix();
      mesh.setMatrixAt(i, _dummy.matrix);

      // Color from HR diagram based on position
      const temp = sampleStarTemperature(rand, r, GALAXY_RADIUS, onArmFactor);
      const rgb = temperatureToRGB(temp);
      _color.setRGB(rgb.r, rgb.g, rgb.b);
      mesh.setColorAt(i, _color);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [seed]);

  // ---- Bulge stars: Sérsic n=4 (de Vaucouleurs) profile ----
  useEffect(() => {
    if (!bulgeRef.current) return;
    const mesh = bulgeRef.current;
    const rand = mulberry32(seed + 2);

    for (let i = 0; i < BULGE_STARS; i++) {
      const r = sampleSersicBulge(rand, BULGE_EFFECTIVE_RADIUS, BULGE_SERSIC_N);

      // Bulge is triaxial (slightly oblate): spherical with y compression
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(2 * rand() - 1);

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta) * 0.6; // Oblate
      const zPos = r * Math.cos(phi);

      // Bulge stars: older population, biased toward K/M types
      const temp = 3500 + rand() * 4000; // 3500-7500K (old pop)
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

  // ---- Dust / emission nebulae along spiral arms ----
  const dustGeometry = useMemo(() => {
    const rand = mulberry32(seed + 3);
    const positions = new Float32Array(DUST_PARTICLES * 3);
    const colors = new Float32Array(DUST_PARTICLES * 3);
    const sizes = new Float32Array(DUST_PARTICLES);

    for (let i = 0; i < DUST_PARTICLES; i++) {
      const r = sampleExponentialDisk(rand, DISK_SCALE_LENGTH * 1.2);
      const theta = rand() * Math.PI * 2;
      const z = sampleVerticalSech2(rand, DISK_SCALE_HEIGHT * 0.7); // Dust is thinner

      // Strongly concentrate on arms
      const armDist = distToNearestArm(r, theta, ARM_COUNT, PITCH_ANGLE, GALAXY_RADIUS);
      const onArm = Math.exp(-(armDist * armDist) / (ARM_WIDTH * ARM_WIDTH * 2));

      if (rand() > onArm * 0.8 + 0.1) {
        // Skip: dust is mostly on arms
        positions[i * 3] = 0;
        positions[i * 3 + 1] = 0;
        positions[i * 3 + 2] = 0;
        sizes[i] = 0; // Zero size = invisible
        continue;
      }

      positions[i * 3] = r * Math.cos(theta);
      positions[i * 3 + 1] = z;
      positions[i * 3 + 2] = r * Math.sin(theta);

      // Nebula color with slight HSL variation
      _color.copy(nebulaColor);
      _color.offsetHSL(rand() * 0.08 - 0.04, 0, rand() * 0.15 - 0.075);
      colors[i * 3] = _color.r;
      colors[i * 3 + 1] = _color.g;
      colors[i * 3 + 2] = _color.b;

      sizes[i] = 1.5 + rand() * 3.5;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    return geo;
  }, [seed, nebulaColor]);

  useEffect(() => {
    return () => {
      dustGeometry.dispose();
    };
  }, [dustGeometry]);

  // ---- Named star children (subcategories) placed along spiral arms ----
  const starPhaseConfig = useMemo(() => {
    const rand = mulberry32(seed + 4);
    return (data.children ?? []).map((star, idx) => {
      let scale = 2;
      let color = '#ffdd44';
      switch (star.starPhase) {
        case 'MAIN_SEQUENCE':
          scale = 2.5;
          color = '#ffee88';
          break;
        case 'GIANT':
          scale = 3.5;
          color = '#ffaa33';
          break;
        case 'RED_GIANT':
          scale = 5;
          color = '#ff4422';
          break;
        case 'PROTOSTAR':
        default:
          scale = 1.8;
          color = '#aa8866';
          break;
      }
      // Place at specific arm positions using logarithmic spiral
      const arm = idx % ARM_COUNT;
      const armPhase = (arm / ARM_COUNT) * Math.PI * 2;
      const r = 15 + idx * 10 + rand() * 5;
      const b = 1 / Math.tan(PITCH_ANGLE);
      const a = GALAXY_RADIUS * 0.05;
      const theta = Math.log(r / a) / b + armPhase;

      return {
        ...star,
        scale,
        color,
        position: [r * Math.cos(theta), (rand() - 0.5) * 2, r * Math.sin(theta)] as [
          number,
          number,
          number,
        ],
      };
    });
  }, [data.children, seed]);

  // ---- Frame animation ----
  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const dist = camera.position.distanceTo(galaxyVec);
    if (dist > LOD.galaxyFar) lodRef.current = 'far';
    else if (dist > LOD.galaxyMid) lodRef.current = 'mid';
    else lodRef.current = 'near';

    // Differential rotation: dust rotates slightly faster than stars (density wave)
    if (dustRef.current) dustRef.current.rotation.y += delta * 0.018;
    if (diskRef.current) diskRef.current.rotation.y += delta * 0.01;
    if (bulgeRef.current) bulgeRef.current.rotation.y += delta * 0.006;
  });

  const planets = data.bodies ?? [];

  return (
    <group ref={groupRef} position={galaxyPos} rotation={eulerRotation}>
      {/* Supermassive black hole at center */}
      <BlackHole
        accentColor={data.colorScheme.primary}
        radius={40}
        onClick={() => onGalaxyClick?.(data.slug)}
      />

      {/* Bulge: Sérsic n=4 profile, old stellar population */}
      <instancedMesh ref={bulgeRef} args={[undefined, undefined, BULGE_STARS]}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>

      {/* Disk: exponential + spiral density wave, HR-diagram colors */}
      <instancedMesh ref={diskRef} args={[undefined, undefined, DISK_STARS]}>
        <sphereGeometry args={[1, 4, 4]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>

      {/* Dust / emission nebulae along arms */}
      <points ref={dustRef} geometry={dustGeometry}>
        <pointsMaterial
          size={2.5}
          sizeAttenuation
          transparent
          opacity={0.35}
          vertexColors
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Named stars (subcategory markers) with glow halos */}
      {starPhaseConfig.map((star) => (
        <group key={star.id} position={star.position}>
          <mesh>
            <sphereGeometry args={[star.scale, 16, 16]} />
            <meshBasicMaterial color={star.color} />
          </mesh>
          <mesh>
            <sphereGeometry args={[star.scale * 1.8, 16, 16]} />
            <meshBasicMaterial
              color={star.color}
              transparent
              opacity={0.15}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        </group>
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
          onClick={() => onPlanetClick?.(planet.slug)}
        />
      ))}
    </group>
  );
}
