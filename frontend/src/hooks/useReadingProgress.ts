'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface ReadingProgress {
  progress: number;
  isComplete: boolean;
}

/**
 * Tracks reading progress from scroll position of a container element.
 * Throttled to ~10fps for performance.
 */
export function useReadingProgress(
  containerRef: React.RefObject<HTMLElement | null>,
): ReadingProgress {
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const lastUpdate = useRef(0);

  const handleScroll = useCallback(() => {
    const now = performance.now();
    if (now - lastUpdate.current < 100) return; // ~10fps throttle
    lastUpdate.current = now;

    const container = containerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const maxScroll = scrollHeight - clientHeight;
    if (maxScroll <= 0) {
      setProgress(100);
      setIsComplete(true);
      return;
    }

    const pct = Math.min(100, Math.round((scrollTop / maxScroll) * 100));
    setProgress(pct);
    if (pct >= 98 && !isComplete) {
      setIsComplete(true);
    }
  }, [containerRef, isComplete]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [containerRef, handleScroll]);

  return { progress, isComplete };
}
