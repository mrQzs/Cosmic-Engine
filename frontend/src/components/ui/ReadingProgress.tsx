'use client';

interface ReadingProgressProps {
  progress: number;
  isComplete: boolean;
}

export default function ReadingProgress({ progress, isComplete }: ReadingProgressProps) {
  return (
    <div className="fixed left-0 right-0 top-0 z-[60] h-1">
      <div
        className="h-full transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
          background: isComplete
            ? 'linear-gradient(90deg, #06b6d4, #7c3aed, #d946ef)'
            : 'linear-gradient(90deg, #06b6d4, #38bdf8)',
          boxShadow: isComplete
            ? '0 0 12px rgba(6, 182, 212, 0.6)'
            : '0 0 8px rgba(6, 182, 212, 0.3)',
        }}
      />
      <div className="absolute right-4 top-2 font-mono text-[10px] text-cosmic-frost/40">
        {progress}%
      </div>
    </div>
  );
}
