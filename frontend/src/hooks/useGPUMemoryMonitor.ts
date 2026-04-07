'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

/**
 * Dev-only hook: logs GPU memory stats every `intervalFrames` frames.
 * No-op in production builds.
 */
export function useGPUMemoryMonitor(intervalFrames = 300): void {
  const frameCount = useRef(0);

  useFrame(({ gl }) => {
    if (process.env.NODE_ENV !== 'development') return;

    frameCount.current += 1;
    if (frameCount.current % intervalFrames !== 0) return;

    console.table({
      geometries: gl.info.memory.geometries,
      textures: gl.info.memory.textures,
      programs: gl.info.programs?.length ?? 0,
      drawCalls: gl.info.render.calls,
      triangles: gl.info.render.triangles,
    });
  });
}
