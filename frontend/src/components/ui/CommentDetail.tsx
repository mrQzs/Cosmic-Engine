'use client';

import { useCommentStore } from '@/stores/commentStore';
import CosmicAvatar from './CosmicAvatar';

interface CommentDetailProps {
  onReply?: (commentId: string) => void;
  onClose?: () => void;
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function CommentDetail({ onReply, onClose }: CommentDetailProps) {
  const selectedId = useCommentStore((s) => s.selectedCommentId);
  const comments = useCommentStore((s) => s.comments);
  const setCommentPanelOpen = useCommentStore((s) => s.setCommentPanelOpen);
  const setReplyingTo = useCommentStore((s) => s.setReplyingTo);

  const comment = comments.find((c) => c.id === selectedId);
  if (!comment) return null;

  const replies = comments.filter((c) => c.parentId === comment.id);

  const handleReply = () => {
    setReplyingTo(comment.id);
    setCommentPanelOpen(true);
    onReply?.(comment.id);
  };

  return (
    <div
      className="hud-panel hud-panel-cornered p-4 max-w-sm w-80"
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
      <div className="flex items-center gap-3 mb-3 relative">
        <CosmicAvatar avatarSeed={comment.avatarSeed} size={32} />
        <div className="flex-1 min-w-0">
          <div className="text-sm text-[var(--text-primary)] font-medium truncate">
            {comment.authorName}
          </div>
          <div className="text-xs text-[var(--text-muted)]">
            {formatTimeAgo(comment.createdAt)}
            {comment.pinned && <span className="ml-2 text-[var(--crt-color)]">[PINNED]</span>}
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs cursor-pointer"
        >
          [X]
        </button>
      </div>

      {/* Content */}
      <div
        className="text-sm text-[var(--text-secondary)] mb-3 leading-relaxed relative"
        dangerouslySetInnerHTML={{ __html: comment.contentHtml }}
      />

      {/* Reactions */}
      {comment.reactions.length > 0 && (
        <div className="flex gap-2 mb-3 relative">
          {comment.reactions.map((r) => (
            <span
              key={r.emoji}
              className="text-xs bg-[rgba(6,182,212,0.1)] border border-[var(--hud-border-color)] rounded px-2 py-0.5"
            >
              {r.emoji} {r.count}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 relative">
        <button
          onClick={handleReply}
          className="text-xs text-[var(--crt-color)] hover:text-[var(--text-primary)] cursor-pointer"
        >
          [REPLY]
        </button>
      </div>

      {/* Replies preview */}
      {replies.length > 0 && (
        <div className="mt-3 pt-3 border-t border-[var(--hud-border-color)] relative">
          <div className="text-xs text-[var(--text-muted)] mb-2">
            {replies.length} sub-satellite{replies.length > 1 ? 's' : ''}
          </div>
          {replies.slice(0, 3).map((reply) => (
            <div key={reply.id} className="flex items-start gap-2 mb-2">
              <CosmicAvatar avatarSeed={reply.avatarSeed} size={20} />
              <div className="flex-1 min-w-0">
                <span className="text-xs text-[var(--text-primary)]">{reply.authorName}</span>
                <div
                  className="text-xs text-[var(--text-muted)] truncate"
                  dangerouslySetInnerHTML={{ __html: reply.contentHtml }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
