'use client';

import { useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useCosmicStore } from '@/stores/cosmicStore';

export function useSceneRouter() {
  const pathname = usePathname();
  const router = useRouter();

  const viewMode = useCosmicStore((s) => s.viewMode);
  const setViewMode = useCosmicStore((s) => s.setViewMode);
  const setCurrentGalaxy = useCosmicStore((s) => s.setCurrentGalaxy);
  const setCurrentPlanet = useCosmicStore((s) => s.setCurrentPlanet);

  // URL → State: sync route changes to store
  useEffect(() => {
    if (pathname === '/') {
      setViewMode('universe');
      setCurrentGalaxy(null);
      setCurrentPlanet(null);
    } else if (pathname.startsWith('/galaxy/')) {
      const slug = pathname.split('/galaxy/')[1];
      if (slug) {
        setViewMode('galaxy');
        setCurrentGalaxy(slug);
        setCurrentPlanet(null);
      }
    } else if (pathname.startsWith('/post/')) {
      const slug = pathname.split('/post/')[1];
      if (slug) {
        setViewMode('article');
        setCurrentPlanet(slug);
      }
    } else if (pathname.startsWith('/archive/')) {
      setViewMode('universe');
      setCurrentGalaxy(null);
      setCurrentPlanet(null);
    } else if (pathname === '/about') {
      setViewMode('universe');
    }
  }, [pathname, setViewMode, setCurrentGalaxy, setCurrentPlanet]);

  // State → URL: programmatic navigation helpers
  const navigateToGalaxy = useCallback(
    (slug: string) => {
      setViewMode('galaxy');
      setCurrentGalaxy(slug);
      setCurrentPlanet(null);
      router.push(`/galaxy/${slug}`);
    },
    [router, setViewMode, setCurrentGalaxy, setCurrentPlanet],
  );

  const navigateToPlanet = useCallback(
    (slug: string) => {
      setViewMode('article');
      setCurrentPlanet(slug);
      router.push(`/post/${slug}`);
    },
    [router, setViewMode, setCurrentPlanet],
  );

  const navigateToUniverse = useCallback(() => {
    setViewMode('universe');
    setCurrentGalaxy(null);
    setCurrentPlanet(null);
    router.push('/');
  }, [router, setViewMode, setCurrentGalaxy, setCurrentPlanet]);

  return { viewMode, navigateToGalaxy, navigateToPlanet, navigateToUniverse };
}
