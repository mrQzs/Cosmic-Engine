'use client';

import { useCommentStore } from '@/stores/commentStore';

const SORT_MODES = [
  { key: 'time' as const, label: 'TIME' },
  { key: 'hot' as const, label: 'HOT' },
  { key: 'thread' as const, label: 'THREAD' },
];

interface CommentSortControlProps {
  totalCount: number;
}

export default function CommentSortControl({ totalCount }: CommentSortControlProps) {
  const sortMode = useCommentStore((s) => s.sortMode);
  const setSortMode = useCommentStore((s) => s.setSortMode);

  return (
    <div
      className="hud-panel px-3 py-2 flex items-center gap-3"
      style={{ fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)' }}
    >
      <span className="text-xs text-[var(--text-muted)] mr-1">SATELLITES: {totalCount}</span>
      <div className="flex gap-1">
        {SORT_MODES.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setSortMode(key)}
            className={`text-xs px-2 py-0.5 rounded transition-colors cursor-pointer ${
              sortMode === key
                ? 'bg-[var(--crt-color)] text-[#0a0a1a]'
                : 'text-[var(--text-muted)] hover:text-[var(--crt-color)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
