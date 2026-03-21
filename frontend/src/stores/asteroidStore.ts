import { create } from 'zustand';

export interface AsteroidData {
  id: string;
  title: string;
  slug: string;
  content: string;
  wordCount: number;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  important: boolean;
  editCount: number;
}

interface AsteroidState {
  asteroids: AsteroidData[];
  selectedAsteroidId: string | null;
  editingAsteroidId: string | null;
  searchQuery: string;
  activeFilterTags: string[];
  highlightedIds: Set<string>;
  selectedForMerge: Set<string>;
}

interface AsteroidActions {
  setAsteroids: (asteroids: AsteroidData[]) => void;
  addAsteroid: (asteroid: AsteroidData) => void;
  removeAsteroid: (id: string) => void;
  updateAsteroid: (id: string, updates: Partial<AsteroidData>) => void;
  setSelectedAsteroid: (id: string | null) => void;
  setEditingAsteroid: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setActiveFilterTags: (tags: string[]) => void;
  setHighlightedIds: (ids: Set<string>) => void;
  toggleMergeSelection: (id: string) => void;
  clearMergeSelection: () => void;
  reset: () => void;
}

const initialState: AsteroidState = {
  asteroids: [],
  selectedAsteroidId: null,
  editingAsteroidId: null,
  searchQuery: '',
  activeFilterTags: [],
  highlightedIds: new Set(),
  selectedForMerge: new Set(),
};

export const useAsteroidStore = create<AsteroidState & AsteroidActions>((set) => ({
  ...initialState,

  setAsteroids: (asteroids) => set({ asteroids }),

  addAsteroid: (asteroid) => set((s) => ({ asteroids: [asteroid, ...s.asteroids] })),

  removeAsteroid: (id) =>
    set((s) => ({
      asteroids: s.asteroids.filter((a) => a.id !== id),
      selectedForMerge: (() => {
        const next = new Set(s.selectedForMerge);
        next.delete(id);
        return next;
      })(),
    })),

  updateAsteroid: (id, updates) =>
    set((s) => ({
      asteroids: s.asteroids.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    })),

  setSelectedAsteroid: (id) => set({ selectedAsteroidId: id }),
  setEditingAsteroid: (id) => set({ editingAsteroidId: id }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setActiveFilterTags: (tags) => set({ activeFilterTags: tags }),
  setHighlightedIds: (ids) => set({ highlightedIds: ids }),

  toggleMergeSelection: (id) =>
    set((s) => {
      const next = new Set(s.selectedForMerge);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return { selectedForMerge: next };
    }),

  clearMergeSelection: () => set({ selectedForMerge: new Set() }),

  reset: () => set(initialState),
}));
