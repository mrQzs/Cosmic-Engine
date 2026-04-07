'use client';

import { useRef, useState, useCallback, useEffect } from 'react';

const VOLUME_KEY = 'cosmic-audio-volume';
const MUTE_KEY = 'cosmic-audio-muted';

export interface AudioSystem {
  play: (name: string) => void;
  setVolume: (v: number) => void;
  volume: number;
  isMuted: boolean;
  toggleMute: () => void;
  isReady: boolean;
}

/**
 * Web Audio API hook for managing background ambience and interaction sounds.
 * AudioContext is created lazily on first user interaction (browser autoplay policy).
 * Audio files should be placed in public/audio/ (e.g., public/audio/click.mp3).
 */
export function useAudioSystem(): AudioSystem {
  const ctxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const bufferCache = useRef<Map<string, AudioBuffer>>(new Map());
  const [isReady, setIsReady] = useState(false);

  const [volume, setVolumeState] = useState(() => {
    if (typeof window === 'undefined') return 0.5;
    const saved = localStorage.getItem(VOLUME_KEY);
    return saved !== null ? parseFloat(saved) : 0.5;
  });

  const [isMuted, setIsMuted] = useState(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem(MUTE_KEY);
    if (saved !== null) {
      // Override saved preference if user prefers reduced motion
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      return prefersReduced ? true : saved === 'true';
    }
    return true; // Default muted
  });

  // Initialize AudioContext on first interaction (stable reference — no state deps)
  const ensureContext = useCallback(() => {
    if (ctxRef.current) return ctxRef.current;

    const ctx = new AudioContext();
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    gain.gain.value = 0; // Start silent; useEffect below syncs real volume

    ctxRef.current = ctx;
    gainRef.current = gain;
    setIsReady(true);
    return ctx;
  }, []);

  // Sync gain node with volume/mute changes
  useEffect(() => {
    if (!gainRef.current) return;
    gainRef.current.gain.value = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    setVolumeState(clamped);
    localStorage.setItem(VOLUME_KEY, String(clamped));
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      localStorage.setItem(MUTE_KEY, String(next));
      return next;
    });
  }, []);

  const play = useCallback(
    async (name: string) => {
      const ctx = ensureContext();
      if (!ctx || ctx.state === 'closed') return;

      // Resume if suspended (autoplay policy)
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      try {
        let buffer = bufferCache.current.get(name);

        if (!buffer) {
          const response = await fetch(`/audio/${name}.mp3`);
          if (!response.ok) return;
          const arrayBuffer = await response.arrayBuffer();
          buffer = await ctx.decodeAudioData(arrayBuffer);
          bufferCache.current.set(name, buffer);
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(gainRef.current!);
        source.start(0);
      } catch {
        // Silently ignore audio playback errors
      }
    },
    [ensureContext],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (ctxRef.current && ctxRef.current.state !== 'closed') {
        ctxRef.current.close();
      }
    };
  }, []);

  return { play, setVolume, volume, isMuted, toggleMute, isReady };
}
