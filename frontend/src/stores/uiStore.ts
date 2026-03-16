import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  hudVisible: boolean;
  searchOverlayOpen: boolean;
}

interface UIActions {
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setHudVisible: (visible: boolean) => void;
  toggleSearchOverlay: () => void;
  setSearchOverlayOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState & UIActions>((set) => ({
  sidebarOpen: false,
  hudVisible: true,
  searchOverlayOpen: false,

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setHudVisible: (visible) => set({ hudVisible: visible }),
  toggleSearchOverlay: () => set((s) => ({ searchOverlayOpen: !s.searchOverlayOpen })),
  setSearchOverlayOpen: (open) => set({ searchOverlayOpen: open }),
}));
