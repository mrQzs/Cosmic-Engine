'use client';

import dynamic from 'next/dynamic';

const CosmicCanvas = dynamic(() => import('@/components/canvas/CosmicCanvas'), {
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-cosmic-void" />,
});

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* 3D canvas as fixed background */}
      <div className="fixed inset-0 -z-10">
        <CosmicCanvas />
      </div>
      {/* DOM overlay content */}
      <div className="relative z-10">{children}</div>
    </>
  );
}
