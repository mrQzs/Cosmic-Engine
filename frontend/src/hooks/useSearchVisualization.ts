'use client';

import { useUIStore } from '@/stores/uiStore';

interface SearchItem {
  slug: string;
}

/**
 * Drives search visualization state.
 * Non-matching planets dim to opacity 0.15, matching pulse emissive.
 * Returns the set of matching planet slugs for the Universe component.
 */
export function useSearchVisualization() {
  const searchResults = useUIStore((s) => s.searchResults);
  const isSearchActive = useUIStore((s) => s.isSearchActive);

  if (!isSearchActive || searchResults.length === 0) {
    return { matchingSlugs: undefined };
  }

  const matchingSlugs = new Set((searchResults as SearchItem[]).map((r) => r.slug));
  return { matchingSlugs };
}
