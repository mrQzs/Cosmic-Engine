'use client';

export default function CosmicLoader() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-cosmic-void">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 rounded-full border-2 border-cosmic-glow border-t-transparent animate-spin" />
        <p className="font-mono text-sm text-cosmic-glow animate-pulse-glow">Loading...</p>
      </div>
    </div>
  );
}
