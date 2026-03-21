'use client';

import { useCallback, useRef } from 'react';
import { useMutation } from '@apollo/client/react';
import { CREATE_COMMENT_MUTATION, REQUEST_POW_CHALLENGE } from '@/graphql/queries/comments';
import { useCommentStore, type OrbitalParams, type PendingComment } from '@/stores/commentStore';
import { solvePoWChallenge } from '@/utils/powChallenge';
import { computeBehaviorScore } from '@/utils/behaviorAnalyzer';

interface SubmitInput {
  bodySlug: string;
  authorName: string;
  authorEmail: string;
  content: string;
  parentId?: string | null;
}

/** Allocate temporary orbital params for a pending comment */
function allocateTempOrbit(existingCount: number): OrbitalParams {
  const satellitesPerRing = 8;
  const ringIndex = Math.floor(existingCount / satellitesPerRing);
  const posInRing = existingCount % satellitesPerRing;
  const phaseSpacing = (2 * Math.PI) / satellitesPerRing;

  return {
    ringIndex,
    orbitRadius: 2.0 + ringIndex * 0.5,
    orbitInclination: ringIndex > 0 ? (ringIndex % 2 === 0 ? -1 : 1) * ringIndex * 0.08 : 0,
    phaseOffset: posInRing * phaseSpacing,
    eccentricity: 0.05,
    orbitalSpeed: 0.8 / Math.sqrt(Math.pow(2.0 + ringIndex * 0.5, 3)),
  };
}

export function useOptimisticComment() {
  const addPending = useCommentStore((s) => s.addPending);
  const promotePending = useCommentStore((s) => s.promotePending);
  const removePending = useCommentStore((s) => s.removePending);
  const totalCount = useCommentStore((s) => s.totalCount);

  const [requestChallenge] = useMutation(REQUEST_POW_CHALLENGE);
  const [createComment] = useMutation(CREATE_COMMENT_MUTATION);

  const submittingRef = useRef(false);

  const submit = useCallback(
    async (input: SubmitInput) => {
      if (submittingRef.current) return;
      submittingRef.current = true;

      const tempId = `pending-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

      try {
        // 0. Check behavior score (Layer 2 anti-spam)
        const behaviorScore = computeBehaviorScore();
        if (behaviorScore < 0.2) {
          throw new Error(
            'Behavior check failed — please interact with the page before commenting',
          );
        }

        // 1. Request PoW challenge
        const { data: challengeData } = await requestChallenge();
        const challenge = challengeData?.requestPowChallenge;
        if (!challenge) throw new Error('Failed to get PoW challenge');

        // 2. Solve PoW (async, ~200ms)
        const nonce = await solvePoWChallenge(challenge.prefix, challenge.difficulty);

        // 3. Add pending (ghost) satellite
        const tempOrbit = allocateTempOrbit(totalCount);
        const avatarSeed = tempId.slice(0, 16); // Temp seed, will be replaced

        const pending: PendingComment = {
          tempId,
          authorName: input.authorName,
          avatarSeed,
          content: input.content,
          parentId: input.parentId,
          orbitalParams: tempOrbit,
          createdAt: Date.now(),
        };
        addPending(pending);

        // 4. Submit to server
        const { data } = await createComment({
          variables: {
            input: {
              bodySlug: input.bodySlug,
              authorName: input.authorName,
              authorEmail: input.authorEmail,
              content: input.content,
              parentId: input.parentId || undefined,
              challengeId: challenge.challengeId,
              powNonce: nonce,
            },
          },
        });

        // 5. Promote pending → real
        if (data?.createComment) {
          promotePending(tempId, data.createComment);
        }
      } catch (err) {
        // Remove ghost satellite on failure
        removePending(tempId);
        throw err;
      } finally {
        submittingRef.current = false;
      }
    },
    [requestChallenge, createComment, addPending, promotePending, removePending, totalCount],
  );

  return { submit, isSubmitting: submittingRef };
}
