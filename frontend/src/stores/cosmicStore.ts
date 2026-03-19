import { create } from 'zustand';
import type { Vector3Tuple } from 'three';
import { QualityLevel } from '@cosmic-engine/shared';

type ViewMode = 'universe' | 'galaxy' | 'planet' | 'article';

interface PostEffectsState {
  bloom: boolean;
  chromaticAberration: boolean;
  glitch: boolean;
}

interface CosmicState {
  focusedBody: string | null;
  cameraTarget: Vector3Tuple;
  isTransitioning: boolean;
  currentGalaxy: string | null;
  currentPlanet: string | null;
  qualityLevel: QualityLevel;
  viewMode: ViewMode;
  postEffectsState: PostEffectsState;
}

interface CosmicActions {
  setFocusedBody: (slug: string | null) => void;
  setCameraTarget: (target: Vector3Tuple) => void;
  setIsTransitioning: (transitioning: boolean) => void;
  setCurrentGalaxy: (slug: string | null) => void;
  setCurrentPlanet: (slug: string | null) => void;
  setQualityLevel: (level: QualityLevel) => void;
  setViewMode: (mode: ViewMode) => void;
  setPostEffectsState: (state: Partial<PostEffectsState>) => void;
}

export const useCosmicStore = create<CosmicState & CosmicActions>((set) => ({
  focusedBody: null,
  cameraTarget: [0, 0, 0],
  isTransitioning: false,
  currentGalaxy: null,
  currentPlanet: null,
  qualityLevel: QualityLevel.High,
  viewMode: 'universe',
  postEffectsState: {
    bloom: false,
    chromaticAberration: false,
    glitch: false,
  },

  setFocusedBody: (slug) => set({ focusedBody: slug }),
  setCameraTarget: (target) => set({ cameraTarget: target }),
  setIsTransitioning: (transitioning) => set({ isTransitioning: transitioning }),
  setCurrentGalaxy: (slug) => set({ currentGalaxy: slug }),
  setCurrentPlanet: (slug) => set({ currentPlanet: slug }),
  setQualityLevel: (level) => set({ qualityLevel: level }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setPostEffectsState: (state) =>
    set((s) => ({ postEffectsState: { ...s.postEffectsState, ...state } })),
}));
