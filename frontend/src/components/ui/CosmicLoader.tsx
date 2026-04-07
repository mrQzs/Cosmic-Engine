'use client';

interface CosmicLoaderProps {
  progress?: number;
  status?: string;
}

function getStageText(progress: number): string {
  if (progress < 30) return 'Compiling shaders...';
  if (progress < 60) return 'Calibrating instruments...';
  return 'Initializing universe...';
}

export default function CosmicLoader({ progress, status }: CosmicLoaderProps) {
  const isIndeterminate = progress === undefined;
  const displayStatus = status ?? (isIndeterminate ? 'Loading...' : getStageText(progress));

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-cosmic-void">
      {/* Progress bar */}
      <div className="relative h-0.5 w-64 overflow-hidden rounded-full bg-cosmic-glow/10">
        {isIndeterminate ? (
          <div className="absolute inset-y-0 w-1/3 animate-[slide_1.5s_ease-in-out_infinite] rounded-full bg-cosmic-glow shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
        ) : (
          <div
            className="h-full rounded-full bg-cosmic-glow shadow-[0_0_8px_rgba(6,182,212,0.6)] transition-[width] duration-300"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        )}
      </div>

      {/* Status text */}
      <p className="mt-4 font-mono text-sm text-cosmic-glow animate-pulse-glow">{displayStatus}</p>

      {/* Percentage */}
      {!isIndeterminate && (
        <p className="mt-1 font-mono text-xs text-cosmic-glow/50">{Math.round(progress)}%</p>
      )}
    </div>
  );
}
