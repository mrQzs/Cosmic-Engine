'use client';

import { useRef, useCallback } from 'react';
import type { ThreeEvent } from '@react-three/fiber';

/**
 * Returns a throttled pointer move handler (~30fps).
 * Use for onPointerMove in R3F components to reduce raycast cost.
 */
export function useThrottledPointerMove(
  handler: (event: ThreeEvent<PointerEvent>) => void,
  intervalMs = 33, // ~30fps
) {
  const lastCall = useRef(0);

  return useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      const now = performance.now();
      if (now - lastCall.current >= intervalMs) {
        lastCall.current = now;
        handler(event);
      }
    },
    [handler, intervalMs],
  );
}
