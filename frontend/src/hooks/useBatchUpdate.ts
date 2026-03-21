'use client';

import { useRef, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';

interface UpdateTask {
  execute: (delta: number) => void;
}

const DEFAULT_BATCH_SIZE = 8;

/**
 * Hook for spreading batch updates across multiple frames.
 * Instead of updating all objects in one frame (which can cause jank),
 * this processes BATCH_SIZE items per frame using Lerp for smooth transitions.
 */
export function useBatchUpdate(batchSize: number = DEFAULT_BATCH_SIZE) {
  const pendingRef = useRef<UpdateTask[]>([]);

  useFrame((_, delta) => {
    if (pendingRef.current.length === 0) return;

    const batch = pendingRef.current.splice(0, batchSize);
    for (const task of batch) {
      task.execute(delta);
    }
  });

  const enqueue = useCallback((tasks: UpdateTask[]) => {
    pendingRef.current.push(...tasks);
  }, []);

  const clear = useCallback(() => {
    pendingRef.current.length = 0;
  }, []);

  const pending = useCallback(() => pendingRef.current.length, []);

  return { enqueue, clear, pending };
}
