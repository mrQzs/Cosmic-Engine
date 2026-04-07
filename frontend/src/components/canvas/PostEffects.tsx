'use client';

import { useCosmicStore } from '@/stores/cosmicStore';
import { QualityLevel } from '@cosmic-engine/shared';
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Glitch,
  SMAA,
} from '@react-three/postprocessing';
import { BlendFunction, GlitchMode } from 'postprocessing';
import { Vector2 } from 'three';

// Pre-allocate vectors to avoid per-render allocations
const CHROMATIC_OFFSET = new Vector2(0.002, 0.002);
const GLITCH_DELAY = new Vector2(0.5, 1.0);
const GLITCH_DURATION = new Vector2(0.1, 0.3);
const GLITCH_STRENGTH = new Vector2(0.1, 0.2);

// Scene-aware bloom: stronger in space views, reduced during reading
type ViewMode = 'universe' | 'galaxy' | 'planet' | 'article';
const BLOOM_INTENSITY: Record<ViewMode, number> = {
  universe: 1.0,
  galaxy: 0.9,
  planet: 0.6,
  article: 0.3,
};
const BLOOM_THRESHOLD: Record<ViewMode, number> = {
  universe: 0.4,
  galaxy: 0.45,
  planet: 0.55,
  article: 0.7,
};

export default function PostEffects() {
  const qualityLevel = useCosmicStore((s) => s.qualityLevel);
  const bloom = useCosmicStore((s) => s.postEffectsState.bloom);
  const chromaticAberration = useCosmicStore((s) => s.postEffectsState.chromaticAberration);
  const glitch = useCosmicStore((s) => s.postEffectsState.glitch);
  const viewMode = useCosmicStore((s) => s.viewMode);

  // Disable all post-processing at Low/UltraLow quality
  if (qualityLevel === QualityLevel.Low || qualityLevel === QualityLevel.UltraLow) {
    return null;
  }

  const anyActive = bloom || chromaticAberration || glitch;
  if (!anyActive) return null;

  // Build effects array to avoid conditional JSX children type issues
  // EffectComposer requires Element children, not `false | Element`
  const effects: React.ReactElement[] = [];

  // SMAA anti-aliasing (always on at High/Medium quality)
  effects.push(<SMAA key="smaa" />);

  if (bloom) {
    const intensity = BLOOM_INTENSITY[viewMode] ?? 0.7;
    const threshold = BLOOM_THRESHOLD[viewMode] ?? 0.5;
    effects.push(
      <Bloom
        key="bloom"
        intensity={intensity}
        luminanceThreshold={threshold}
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

  return <EffectComposer multisampling={0}>{effects}</EffectComposer>;
}
