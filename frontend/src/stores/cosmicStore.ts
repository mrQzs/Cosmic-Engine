import { create } from 'zustand';
import type { Vector3Tuple } from 'three';

interface CosmicState {
  focusedBody: string | null;
  cameraTarget: Vector3Tuple;
  isTransitioning: boolean;
}

interface CosmicActions {
  setFocusedBody: (slug: string | null) => void;
  setCameraTarget: (target: Vector3Tuple) => void;
  setIsTransitioning: (transitioning: boolean) => void;
}

export const useCosmicStore = create<CosmicState & CosmicActions>((set) => ({
  focusedBody: null,
  cameraTarget: [0, 0, 0],
  isTransitioning: false,

  setFocusedBody: (slug) => set({ focusedBody: slug }),
  setCameraTarget: (target) => set({ cameraTarget: target }),
  setIsTransitioning: (transitioning) => set({ isTransitioning: transitioning }),
}));
