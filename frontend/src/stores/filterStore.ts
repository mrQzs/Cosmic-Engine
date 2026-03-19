import { create } from 'zustand';

interface FilterState {
  activeTag: string | null;
  filteredPlanetSlugs: Set<string>;
}

interface FilterActions {
  setActiveTag: (tag: string | null) => void;
  setFilteredPlanetSlugs: (slugs: Set<string>) => void;
  clearFilter: () => void;
}

export const useFilterStore = create<FilterState & FilterActions>((set) => ({
  activeTag: null,
  filteredPlanetSlugs: new Set(),

  setActiveTag: (tag) => set({ activeTag: tag }),
  setFilteredPlanetSlugs: (slugs) => set({ filteredPlanetSlugs: slugs }),
  clearFilter: () => set({ activeTag: null, filteredPlanetSlugs: new Set() }),
}));
