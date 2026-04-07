'use client';

import dynamic from 'next/dynamic';
import { useDeviceCapability } from '@/hooks/useDeviceCapability';
import FlatCosmicView from '@/components/fallback/FlatCosmicView';

const CosmicCanvas = dynamic(() => import('@/components/canvas/CosmicCanvas'), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-screen items-center justify-center bg-cosmic-void">
      <p className="font-mono text-sm text-cosmic-glow animate-pulse-glow">
        Initializing cosmic engine...
      </p>
    </div>
  ),
});

/**
 * Client-side canvas router: renders 3D CosmicCanvas or 2D FlatCosmicView
 * based on device WebGL2 capability.
 */
export default function ClientCanvas() {
  const { capabilityLevel } = useDeviceCapability();

  return capabilityLevel === '2d-fallback' ? <FlatCosmicView /> : <CosmicCanvas />;
}
