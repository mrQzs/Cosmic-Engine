'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { useCommentStore } from '@/stores/commentStore';

interface CommentHUDProps {
  bodySlug: string;
  onSubmit: (data: {
    authorName: string;
    authorEmail: string;
    content: string;
    parentId?: string | null;
  }) => void;
  submitting?: boolean;
}

export default function CommentHUD({
  bodySlug: _bodySlug,
  onSubmit,
  submitting = false,
}: CommentHUDProps) {
  const commentPanelOpen = useCommentStore((s) => s.commentPanelOpen);
  const setCommentPanelOpen = useCommentStore((s) => s.setCommentPanelOpen);
  const replyingTo = useCommentStore((s) => s.replyingTo);
  const setReplyingTo = useCommentStore((s) => s.setReplyingTo);
  const comments = useCommentStore((s) => s.comments);

  const [authorName, setAuthorName] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
  const [content, setContent] = useState('');

  const contentRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea when panel opens
  useEffect(() => {
    if (commentPanelOpen && contentRef.current) {
      contentRef.current.focus();
    }
  }, [commentPanelOpen]);

  // Keyboard shortcut: Enter to open panel (when not open)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && commentPanelOpen) {
        setCommentPanelOpen(false);
        setReplyingTo(null);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [commentPanelOpen, setCommentPanelOpen, setReplyingTo]);

  const replyTarget = replyingTo ? comments.find((c) => c.id === replyingTo) : null;

  const handleSubmit = useCallback(() => {
    if (!authorName.trim() || !content.trim()) return;
    onSubmit({
      authorName: authorName.trim(),
      authorEmail: authorEmail.trim(),
      content: content.trim(),
      parentId: replyingTo,
    });
    setContent('');
  }, [authorName, authorEmail, content, replyingTo, onSubmit]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!commentPanelOpen) {
    return (
      <button
        onClick={() => setCommentPanelOpen(true)}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 hud-panel px-6 py-3 font-mono text-sm text-[var(--crt-color)] hover:border-[var(--hud-border-color-active)] transition-all cursor-pointer"
        style={{ fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)' }}
      >
        [ LAUNCH COMMENT ]
      </button>
    );
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 hud-panel hud-panel-cornered mx-auto max-w-2xl mb-4 p-5 animate-in slide-in-from-bottom duration-300"
      style={{ fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)' }}
    >
      {/* Scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none rounded-md overflow-hidden"
        style={{
          background: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent var(--scanline-spacing),
            var(--crt-scanline-color) var(--scanline-spacing),
            var(--crt-scanline-color) calc(var(--scanline-spacing) + 1px)
          )`,
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-[var(--crt-color)] uppercase tracking-wider">
          {replyTarget ? `// RE: ${replyTarget.authorName}` : '// SATELLITE LAUNCH SEQUENCE'}
        </span>
        <button
          onClick={() => {
            setCommentPanelOpen(false);
            setReplyingTo(null);
          }}
          className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs cursor-pointer"
        >
          [ESC]
        </button>
      </div>

      {/* Identity fields */}
      <div className="flex gap-3 mb-3">
        <input
          type="text"
          placeholder="CALLSIGN *"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          className="flex-1 bg-transparent border border-[var(--hud-border-color)] rounded px-3 py-1.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--crt-color)] focus:outline-none transition-colors"
        />
        <input
          type="email"
          placeholder="FREQ (email)"
          value={authorEmail}
          onChange={(e) => setAuthorEmail(e.target.value)}
          className="flex-1 bg-transparent border border-[var(--hud-border-color)] rounded px-3 py-1.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--crt-color)] focus:outline-none transition-colors"
        />
      </div>

      {/* Content */}
      <textarea
        ref={contentRef}
        placeholder="TRANSMIT YOUR MESSAGE..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={3}
        className="w-full bg-transparent border border-[var(--hud-border-color)] rounded px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--crt-color)] focus:outline-none transition-colors resize-none mb-3"
      />

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-[var(--text-muted)]">Ctrl+Enter to launch</span>
        <button
          onClick={handleSubmit}
          disabled={!authorName.trim() || !content.trim() || submitting}
          className="px-5 py-1.5 text-sm rounded border border-[var(--crt-color)] text-[var(--crt-color)] hover:bg-[var(--crt-color)] hover:text-[#0a0a1a] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          {submitting ? '[ TRANSMITTING... ]' : '[ LAUNCH ]'}
        </button>
      </div>
    </div>
  );
}
