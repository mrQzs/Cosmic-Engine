'use client';

interface SignalLostProps {
  error?: Error;
  resetFn?: () => void;
  title?: string;
}

export default function SignalLost({ error, resetFn, title = 'SIGNAL LOST' }: SignalLostProps) {
  return (
    <div className="error-signal-lost bg-cosmic-void">
      <div className="static-noise" />
      <div className="error-message z-10 text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-widest">{title}</h1>
        {error && (
          <p className="mb-6 max-w-md text-sm opacity-70">
            {error.message || 'An unknown rendering error occurred.'}
          </p>
        )}
        <p className="mb-8 text-sm opacity-50">
          The 3D rendering pipeline has encountered an anomaly.
        </p>
        {resetFn && (
          <button
            onClick={resetFn}
            className="rounded border border-cosmic-glow/30 px-6 py-2 font-mono text-sm text-cosmic-glow transition-all hover:border-cosmic-glow/60 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]"
          >
            [ RECALIBRATE ]
          </button>
        )}
      </div>
    </div>
  );
}
