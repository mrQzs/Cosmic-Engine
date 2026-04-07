'use client';

import { useState, useEffect } from 'react';

export interface AccessibilityState {
  prefersReducedMotion: boolean;
  isKeyboardNavigating: boolean;
}

export function useAccessibility(): AccessibilityState {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isKeyboardNavigating, setIsKeyboardNavigating] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mql.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    mql.addEventListener('change', handleChange);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') setIsKeyboardNavigating(true);
    };
    const handleMouseDown = () => setIsKeyboardNavigating(false);

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      mql.removeEventListener('change', handleChange);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  return { prefersReducedMotion, isKeyboardNavigating };
}
