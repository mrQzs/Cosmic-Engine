'use client';

import { useMemo } from 'react';
import { useCosmicStore } from '@/stores/cosmicStore';
import { QualityLevel } from '@cosmic-engine/shared';
import { EffectComposer, Bloom, ChromaticAberration, Glitch } from '@react-three/postprocessing';
import { BlendFunction, GlitchMode } from 'postprocessing';
import { Vector2 } from 'three';

// Pre-allocate vectors to avoid per-render allocations
const CHROMATIC_OFFSET = new Vector2(0.002, 0.002);
const GLITCH_DELAY = new Vector2(0.5, 1.0);
const GLITCH_DURATION = new Vector2(0.1, 0.3);
const GLITCH_STRENGTH = new Vector2(0.1, 0.2);

export default function PostEffects() {
  const qualityLevel = useCosmicStore((s) => s.qualityLevel);
  const bloom = useCosmicStore((s) => s.postEffectsState.bloom);
  const chromaticAberration = useCosmicStore((s) => s.postEffectsState.chromaticAberration);
  const glitch = useCosmicStore((s) => s.postEffectsState.glitch);

  // Disable all post-processing at Low/UltraLow quality
  if (qualityLevel === QualityLevel.Low || qualityLevel === QualityLevel.UltraLow) {
    return null;
  }

  const anyActive = bloom || chromaticAberration || glitch;
  if (!anyActive) return null;

  // Build effects array to avoid conditional JSX children type issues
  // EffectComposer requires Element children, not `false | Element`
  const effects: React.ReactElement[] = [];
  if (bloom) {
    effects.push(
      <Bloom
        key="bloom"
        intensity={0.5}
        luminanceThreshold={0.6}
        luminanceSmoothing={0.3}
        mipmapBlur
      />,
    );
  }
  if (chromaticAberration) {
    effects.push(
      <ChromaticAberration
        key="chromatic"
        blendFunction={BlendFunction.NORMAL}
        offset={CHROMATIC_OFFSET}
      />,
    );
  }
  if (glitch) {
    effects.push(
      <Glitch
        key="glitch"
        mode={GlitchMode.SPORADIC}
        delay={GLITCH_DELAY}
        duration={GLITCH_DURATION}
        strength={GLITCH_STRENGTH}
      />,
    );
  }

  return <EffectComposer>{effects}</EffectComposer>;
}
