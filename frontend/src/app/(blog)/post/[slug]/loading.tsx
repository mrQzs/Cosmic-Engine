export default function PostLoading() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="hud-panel p-8 text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-cosmic-glow border-t-transparent" />
        <p className="font-mono text-sm text-cosmic-glow animate-pulse-glow">
          Entering atmosphere...
        </p>
        <div className="mt-4 space-y-2">
          <div className="h-4 w-48 animate-pulse rounded bg-cosmic-frost/10" />
          <div className="h-4 w-36 animate-pulse rounded bg-cosmic-frost/10" />
          <div className="h-4 w-52 animate-pulse rounded bg-cosmic-frost/10" />
        </div>
      </div>
    </div>
  );
}
