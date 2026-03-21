'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface QuickCaptureProps {
  onSubmit: (content: string) => void;
  submitting?: boolean;
}

export default function QuickCapture({ onSubmit, submitting = false }: QuickCaptureProps) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Global shortcut: Ctrl+Shift+I
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open]);

  // Focus on open
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const handleSubmit = useCallback(() => {
    if (!content.trim()) return;
    onSubmit(content.trim());
    setContent('');
    setOpen(false);
  }, [content, onSubmit]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
      <div
        className="hud-panel hud-panel-cornered max-w-md w-full p-5"
        style={{ fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)' }}
      >
        {/* Scanline */}
        <div
          className="absolute inset-0 pointer-events-none rounded-md overflow-hidden"
          style={{
            background: `repeating-linear-gradient(0deg, transparent, transparent var(--scanline-spacing), var(--crt-scanline-color) var(--scanline-spacing), var(--crt-scanline-color) calc(var(--scanline-spacing) + 1px))`,
          }}
        />

        <div className="text-xs text-[var(--crt-color)] uppercase tracking-wider mb-3 relative">
          // QUICK CAPTURE — ASTEROID FRAGMENT
        </div>

        <textarea
          ref={inputRef}
          placeholder="Capture your inspiration..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={4}
          className="w-full bg-transparent border border-[var(--hud-border-color)] rounded px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--crt-color)] focus:outline-none transition-colors resize-none mb-3 relative"
        />

        <div className="flex items-center justify-between relative">
          <span className="text-xs text-[var(--text-muted)]">
            Ctrl+Enter to cast · Esc to close
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setOpen(false)}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              [CANCEL]
            </button>
            <button
              onClick={handleSubmit}
              disabled={!content.trim() || submitting}
              className="px-4 py-1 text-xs rounded border border-[var(--crt-color)] text-[var(--crt-color)] hover:bg-[var(--crt-color)] hover:text-[#0a0a1a] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {submitting ? '[ CASTING... ]' : '[ CAST ]'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
