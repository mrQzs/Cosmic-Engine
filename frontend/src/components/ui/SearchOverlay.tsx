'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useLazyQuery } from '@apollo/client/react';
import { SEARCH_QUERY } from '@/graphql/queries/universe';
import { useUIStore } from '@/stores/uiStore';
import { useRouter } from 'next/navigation';

interface SearchResultItem {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  tags?: { name: string; slug: string; color: string }[];
}

interface SearchQueryData {
  searchBodies: {
    items: SearchResultItem[];
    total: number;
    hasMore: boolean;
  };
}

export default function SearchOverlay() {
  const isOpen = useUIStore((s) => s.searchOverlayOpen);
  const setSearchOverlayOpen = useUIStore((s) => s.setSearchOverlayOpen);
  const setSearchResults = useUIStore((s) => s.setSearchResults);
  const setIsSearchActive = useUIStore((s) => s.setIsSearchActive);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const router = useRouter();

  const [executeSearch, { loading }] = useLazyQuery<SearchQueryData>(SEARCH_QUERY);

  // Debounce search input (300ms)
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSearchResults([]);
      setIsSearchActive(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const { data } = await executeSearch({
        variables: { query: query.trim(), pageSize: 20 },
      });
      const items = (data?.searchBodies?.items ?? []) as SearchResultItem[];
      setResults(items);
      setSearchResults(items as unknown[]);
      setIsSearchActive(items.length > 0);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, executeSearch, setSearchResults, setIsSearchActive]);

  // ESC to close — Zustand setters are stable refs, only isOpen needs tracking
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchOverlayOpen(false);
        setQuery('');
        setResults([]);
        setSearchResults([]);
        setIsSearchActive(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, setSearchOverlayOpen, setSearchResults, setIsSearchActive]);

  const handleSelect = useCallback(
    (slug: string) => {
      setSearchOverlayOpen(false);
      setQuery('');
      setIsSearchActive(false);
      router.push(`/post/${slug}`);
    },
    [router, setSearchOverlayOpen, setIsSearchActive],
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center pt-[12vh]">
      <div
        className="absolute inset-0 bg-cosmic-void/60 backdrop-blur-sm"
        onClick={() => {
          setSearchOverlayOpen(false);
          setIsSearchActive(false);
        }}
      />
      <div className="relative z-10 w-full max-w-xl">
        <div className="hud-panel overflow-hidden">
          <div className="flex items-center gap-2 border-b border-cosmic-frost/10 px-4">
            <span className="text-cosmic-frost/30">⌕</span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search articles..."
              autoFocus
              className="w-full bg-transparent py-3 font-mono text-sm text-cosmic-frost outline-none placeholder:text-cosmic-frost/30"
            />
            {loading && (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-cosmic-glow border-t-transparent" />
            )}
          </div>

          {results.length > 0 && (
            <div className="max-h-[50vh] overflow-y-auto p-2">
              {results.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.slug)}
                  className="flex w-full flex-col rounded px-3 py-2 text-left hover:bg-cosmic-frost/5"
                >
                  <span className="text-sm text-cosmic-frost">{item.title}</span>
                  {item.excerpt && (
                    <span className="mt-0.5 text-xs text-cosmic-frost/40 line-clamp-1">
                      {item.excerpt}
                    </span>
                  )}
                  <div className="mt-1 flex gap-2">
                    {item.tags?.map((tag) => (
                      <span
                        key={tag.slug}
                        className="font-mono text-[10px]"
                        style={{ color: tag.color }}
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          )}

          {query && !loading && results.length === 0 && (
            <p className="p-4 text-center text-sm text-cosmic-frost/30">
              No results for &ldquo;{query}&rdquo;
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
