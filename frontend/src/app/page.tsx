'use client';

import dynamic from 'next/dynamic';

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

export default function Home() {
  return (
    <main className="h-screen w-screen">
      <CosmicCanvas />
    </main>
  );
}
