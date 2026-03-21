'use client';

import { useQuery } from '@apollo/client/react';
import { useCallback, useEffect } from 'react';
import { COMMENTS_QUERY } from '@/graphql/queries/comments';
import { useCommentStore, type CommentData } from '@/stores/commentStore';

interface CommentEdge {
  cursor: string;
  node: CommentData;
}

interface CommentsQueryResult {
  comments: {
    edges: CommentEdge[];
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string | null;
    };
    totalCount: number;
  };
}

const DEFAULT_LIMIT = 50;

export function useCommentData(bodySlug: string | null) {
  const setComments = useCommentStore((s) => s.setComments);
  const setTotalCount = useCommentStore((s) => s.setTotalCount);

  const { data, loading, error, fetchMore } = useQuery<CommentsQueryResult>(COMMENTS_QUERY, {
    variables: { bodySlug, limit: DEFAULT_LIMIT },
    skip: !bodySlug,
    fetchPolicy: 'cache-and-network',
  });

  // Sync Apollo data to Zustand store
  useEffect(() => {
    if (data?.comments) {
      const comments = data.comments.edges.map((e) => e.node);
      setComments(comments);
      setTotalCount(data.comments.totalCount);
    }
  }, [data, setComments, setTotalCount]);

  const loadMore = useCallback(() => {
    if (!data?.comments.pageInfo.hasNextPage) return;
    return fetchMore({
      variables: { cursor: data.comments.pageInfo.endCursor },
    });
  }, [data, fetchMore]);

  return {
    comments: data?.comments.edges.map((e) => e.node) ?? [],
    totalCount: data?.comments.totalCount ?? 0,
    hasMore: data?.comments.pageInfo.hasNextPage ?? false,
    loading,
    error,
    loadMore,
  };
}
