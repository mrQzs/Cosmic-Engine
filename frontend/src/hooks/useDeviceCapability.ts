'use client';

import { useState, useEffect } from 'react';

export type CapabilityLevel = 'full-3d' | '2d-fallback';

export interface DeviceCapability {
  capabilityLevel: CapabilityLevel;
  webgl2: boolean;
  cores: number;
  memoryGB: number | undefined;
}

export function useDeviceCapability(): DeviceCapability {
  const [capability, setCapability] = useState<DeviceCapability>({
    capabilityLevel: 'full-3d',
    webgl2: true,
    cores: 4,
    memoryGB: undefined,
  });

  useEffect(() => {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    const webgl2 = !!gl;
    const cores = navigator.hardwareConcurrency || 2;
    const memoryGB = (navigator as unknown as { deviceMemory?: number }).deviceMemory;

    // Clean up the test canvas context
    if (gl) {
      const ext = gl.getExtension('WEBGL_lose_context');
      ext?.loseContext();
    }

    const capabilityLevel: CapabilityLevel =
      !webgl2 || cores < 2 || (memoryGB !== undefined && memoryGB < 4) ? '2d-fallback' : 'full-3d';

    setCapability({ capabilityLevel, webgl2, cores, memoryGB });
  }, []);

  return capability;
}
