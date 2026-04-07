'use client';

import { useAudioSystem } from '@/hooks/useAudioSystem';

/** HUD-style audio volume control panel, fixed to bottom-right. */
export default function AudioControl() {
  const { volume, isMuted, setVolume, toggleMute } = useAudioSystem();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg border border-cosmic-glow/20 bg-cosmic-void/80 px-3 py-2 backdrop-blur-sm">
      <button
        onClick={toggleMute}
        className="font-mono text-sm text-cosmic-glow transition-opacity hover:opacity-80"
        aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
      >
        {isMuted ? '🔇' : volume > 0.5 ? '🔊' : '🔉'}
      </button>
      <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={isMuted ? 0 : volume}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          setVolume(v);
          if (isMuted && v > 0) toggleMute();
        }}
        className="h-1 w-20 cursor-pointer appearance-none rounded-full bg-cosmic-glow/20 accent-cosmic-glow"
        aria-label="Volume"
      />
    </div>
  );
}
