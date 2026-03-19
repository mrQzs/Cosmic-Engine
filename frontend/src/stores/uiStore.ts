import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  hudVisible: boolean;
  searchOverlayOpen: boolean;
  searchQuery: string;
  searchResults: unknown[];
  isSearchActive: boolean;
}

interface UIActions {
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setHudVisible: (visible: boolean) => void;
  toggleSearchOverlay: () => void;
  setSearchOverlayOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: unknown[]) => void;
  setIsSearchActive: (active: boolean) => void;
}

export const useUIStore = create<UIState & UIActions>((set) => ({
  sidebarOpen: false,
  hudVisible: true,
  searchOverlayOpen: false,
  searchQuery: '',
  searchResults: [],
  isSearchActive: false,

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setHudVisible: (visible) => set({ hudVisible: visible }),
  toggleSearchOverlay: () => set((s) => ({ searchOverlayOpen: !s.searchOverlayOpen })),
  setSearchOverlayOpen: (open) => set({ searchOverlayOpen: open }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSearchResults: (results) => set({ searchResults: results }),
  setIsSearchActive: (active) => set({ isSearchActive: active }),
}));
