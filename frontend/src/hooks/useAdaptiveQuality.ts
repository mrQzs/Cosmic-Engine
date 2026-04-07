'use client';

import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useCosmicStore } from '@/stores/cosmicStore';
import { QualityLevel, QUALITY_DPR } from '@cosmic-engine/shared';

const DOWNGRADE_FPS = 30;
const UPGRADE_FPS = 55;
const DOWNGRADE_DELAY = 3; // seconds below threshold before downgrade
const UPGRADE_DELAY = 10; // seconds above threshold before upgrade
const SAMPLE_INTERVAL = 30; // frames between FPS samples

const QUALITY_ORDER: QualityLevel[] = [
  QualityLevel.High,
  QualityLevel.Medium,
  QualityLevel.Low,
  QualityLevel.UltraLow,
];

function applyDpr(gl: THREE.WebGLRenderer, level: QualityLevel) {
  const tier = QUALITY_DPR[level] ?? QUALITY_DPR.high;
  gl.setPixelRatio(Math.min(window.devicePixelRatio, tier.max));
}

/**
 * Monitors framerate and auto-switches quality tiers.
 * Downgrade after 3s < 30fps, upgrade after 10s > 55fps.
 */
export function useAdaptiveQuality() {
  const setQualityLevel = useCosmicStore((s) => s.setQualityLevel);
  const gl = useThree((s) => s.gl);

  const fpsAccum = useRef(0);
  const frameCount = useRef(0);
  const belowTimer = useRef(0);
  const aboveTimer = useRef(0);

  useFrame((_, delta) => {
    const fps = 1 / Math.max(delta, 0.001);
    fpsAccum.current += fps;
    frameCount.current += 1;

    if (frameCount.current < SAMPLE_INTERVAL) return;

    const avgFps = fpsAccum.current / frameCount.current;
    const elapsed = frameCount.current * delta; // approximate time since last sample
    fpsAccum.current = 0;
    frameCount.current = 0;

    const currentLevel = useCosmicStore.getState().qualityLevel;
    const idx = QUALITY_ORDER.indexOf(currentLevel);

    if (avgFps < DOWNGRADE_FPS) {
      aboveTimer.current = 0;
      belowTimer.current += elapsed;
      if (belowTimer.current >= DOWNGRADE_DELAY && idx < QUALITY_ORDER.length - 1) {
        const newLevel = QUALITY_ORDER[idx + 1];
        setQualityLevel(newLevel);
        applyDpr(gl, newLevel);
        belowTimer.current = 0;
      }
    } else if (avgFps > UPGRADE_FPS) {
      belowTimer.current = 0;
      aboveTimer.current += elapsed;
      if (aboveTimer.current >= UPGRADE_DELAY && idx > 0) {
        const newLevel = QUALITY_ORDER[idx - 1];
        setQualityLevel(newLevel);
        applyDpr(gl, newLevel);
        aboveTimer.current = 0;
      }
    } else {
      belowTimer.current = 0;
      aboveTimer.current = 0;
    }
  });
}
