'use client';

import { useEffect, useCallback } from 'react';
import { useAsteroidStore } from '@/stores/asteroidStore';

interface InspirationToastProps {
  onEdit?: (id: string) => void;
  onClose?: () => void;
  isAdmin?: boolean;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function InspirationToast({
  onEdit,
  onClose,
  isAdmin = false,
}: InspirationToastProps) {
  const selectedId = useAsteroidStore((s) => s.selectedAsteroidId);
  const asteroids = useAsteroidStore((s) => s.asteroids);
  const setSelectedAsteroid = useAsteroidStore((s) => s.setSelectedAsteroid);

  const asteroid = asteroids.find((a) => a.id === selectedId);
  const currentIdx = asteroids.findIndex((a) => a.id === selectedId);

  const navigatePrev = useCallback(() => {
    if (currentIdx > 0) {
      setSelectedAsteroid(asteroids[currentIdx - 1].id);
    }
  }, [currentIdx, asteroids, setSelectedAsteroid]);

  const navigateNext = useCallback(() => {
    if (currentIdx < asteroids.length - 1) {
      setSelectedAsteroid(asteroids[currentIdx + 1].id);
    }
  }, [currentIdx, asteroids, setSelectedAsteroid]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') navigatePrev();
      else if (e.key === 'ArrowRight') navigateNext();
      else if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [navigatePrev, navigateNext, onClose]);

  if (!asteroid) return null;

  return (
    <div
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 hud-panel hud-panel-cornered max-w-lg w-full p-4"
      style={{ fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)' }}
    >
      {/* Scanline */}
      <div
        className="absolute inset-0 pointer-events-none rounded-md overflow-hidden"
        style={{
          background: `repeating-linear-gradient(0deg, transparent, transparent var(--scanline-spacing), var(--crt-scanline-color) var(--scanline-spacing), var(--crt-scanline-color) calc(var(--scanline-spacing) + 1px))`,
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-2 relative">
        <span className="text-xs text-[var(--crt-color)] uppercase tracking-wider">
          {`// ASTEROID FRAGMENT ${currentIdx + 1}/${asteroids.length}`}
        </span>
        <div className="flex items-center gap-2">
          {asteroid.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs bg-[rgba(6,182,212,0.1)] border border-[var(--hud-border-color)] rounded px-1.5 py-0.5 text-[var(--text-muted)]"
            >
              {tag}
            </span>
          ))}
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs cursor-pointer"
          >
            [X]
          </button>
        </div>
      </div>

      {/* Title */}
      {asteroid.title && (
        <div className="text-sm text-[var(--text-primary)] font-medium mb-1 relative">
          {asteroid.title}
        </div>
      )}

      {/* Content */}
      <div className="text-sm text-[var(--text-secondary)] leading-relaxed mb-3 max-h-40 overflow-y-auto relative">
        {asteroid.content}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between relative">
        <div className="text-xs text-[var(--text-muted)]">
          {formatDate(asteroid.createdAt)} · {asteroid.wordCount} words
          {asteroid.important && <span className="ml-2 text-[var(--crt-color)]">[IMPORTANT]</span>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={navigatePrev}
            disabled={currentIdx <= 0}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--crt-color)] disabled:opacity-30 cursor-pointer"
          >
            [←]
          </button>
          <button
            onClick={navigateNext}
            disabled={currentIdx >= asteroids.length - 1}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--crt-color)] disabled:opacity-30 cursor-pointer"
          >
            [→]
          </button>
          {isAdmin && (
            <button
              onClick={() => onEdit?.(asteroid.id)}
              className="text-xs text-[var(--crt-color)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              [EDIT]
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
