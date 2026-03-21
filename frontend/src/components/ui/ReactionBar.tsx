'use client';

import { useCallback } from 'react';
import { useMutation } from '@apollo/client/react';
import { ADD_REACTION_MUTATION } from '@/graphql/queries/comments';
import type { ReactionData } from '@/stores/commentStore';

const SPACE_REACTIONS = [
  { emoji: '⭐', label: 'Stellar' },
  { emoji: '🚀', label: 'Launch' },
  { emoji: '🌍', label: 'Deep' },
  { emoji: '☄️', label: 'Impact' },
  { emoji: '🛸', label: 'Mind-blown' },
  { emoji: '🌑', label: 'Ponder' },
] as const;

interface ReactionBarProps {
  targetId: string;
  reactions: ReactionData[];
  compact?: boolean;
}

export default function ReactionBar({ targetId, reactions, compact = false }: ReactionBarProps) {
  const [addReaction] = useMutation(ADD_REACTION_MUTATION);

  const handleReact = useCallback(
    async (emoji: string) => {
      try {
        await addReaction({
          variables: {
            input: { targetId, emoji },
          },
          // Optimistic UI: immediately increment count locally
          optimisticResponse: {
            addReaction: {
              __typename: 'Reaction',
              id: `temp-${Date.now()}`,
              targetId,
              emoji,
              count: (reactions.find((r) => r.emoji === emoji)?.count ?? 0) + 1,
            },
          },
        });
      } catch {
        // Silently fail for reactions
      }
    },
    [targetId, reactions, addReaction],
  );

  const reactionMap = new Map(reactions.map((r) => [r.emoji, r.count]));

  if (compact) {
    // Compact: only show reactions that have counts
    const active = SPACE_REACTIONS.filter((r) => reactionMap.has(r.emoji));
    if (active.length === 0) return null;
    return (
      <div className="flex gap-1.5 flex-wrap">
        {active.map(({ emoji }) => (
          <button
            key={emoji}
            onClick={() => handleReact(emoji)}
            className="text-xs bg-[rgba(6,182,212,0.08)] border border-[var(--hud-border-color)] rounded px-1.5 py-0.5 hover:border-[var(--crt-color)] transition-colors cursor-pointer"
          >
            {emoji} {reactionMap.get(emoji) || 0}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-1.5 flex-wrap">
      {SPACE_REACTIONS.map(({ emoji, label }) => {
        const count = reactionMap.get(emoji) || 0;
        return (
          <button
            key={emoji}
            onClick={() => handleReact(emoji)}
            title={label}
            className="text-xs bg-[rgba(6,182,212,0.05)] border border-[var(--hud-border-color)] rounded px-2 py-1 hover:border-[var(--crt-color)] hover:bg-[rgba(6,182,212,0.1)] transition-colors cursor-pointer"
          >
            {emoji} {count > 0 && <span className="ml-0.5 text-[var(--text-muted)]">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
