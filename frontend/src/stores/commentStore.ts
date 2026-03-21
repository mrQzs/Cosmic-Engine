import { create } from 'zustand';

export interface OrbitalParams {
  ringIndex: number;
  orbitRadius: number;
  orbitInclination: number;
  phaseOffset: number;
  eccentricity: number;
  orbitalSpeed: number;
}

export interface ReactionData {
  emoji: string;
  count: number;
}

export interface CommentData {
  id: string;
  bodySlug: string;
  authorName: string;
  authorEmail?: string | null;
  avatarSeed: string;
  contentHtml: string;
  orbitalParams: OrbitalParams;
  parentId?: string | null;
  replies: CommentData[];
  reactions: ReactionData[];
  pinned: boolean;
  createdAt: string;
}

export interface PendingComment {
  tempId: string;
  authorName: string;
  avatarSeed: string;
  content: string;
  parentId?: string | null;
  orbitalParams: OrbitalParams;
  createdAt: number;
}

type SortMode = 'time' | 'hot' | 'thread';

interface CommentState {
  comments: CommentData[];
  pendingComments: PendingComment[];
  selectedCommentId: string | null;
  commentPanelOpen: boolean;
  sortMode: SortMode;
  replyingTo: string | null;
  totalCount: number;
  expandedThreads: Set<string>;
}

interface CommentActions {
  setComments: (comments: CommentData[]) => void;
  addComment: (comment: CommentData) => void;
  removeComment: (id: string) => void;
  addPending: (pending: PendingComment) => void;
  promotePending: (tempId: string, real: CommentData) => void;
  removePending: (tempId: string) => void;
  setSelectedComment: (id: string | null) => void;
  setCommentPanelOpen: (open: boolean) => void;
  setSortMode: (mode: SortMode) => void;
  setReplyingTo: (id: string | null) => void;
  setTotalCount: (count: number) => void;
  toggleThread: (id: string) => void;
  reset: () => void;
}

const initialState: CommentState = {
  comments: [],
  pendingComments: [],
  selectedCommentId: null,
  commentPanelOpen: false,
  sortMode: 'time',
  replyingTo: null,
  totalCount: 0,
  expandedThreads: new Set(),
};

export const useCommentStore = create<CommentState & CommentActions>((set) => ({
  ...initialState,

  setComments: (comments) => set({ comments }),

  addComment: (comment) =>
    set((s) => ({
      comments: [...s.comments, comment],
      totalCount: s.totalCount + 1,
    })),

  removeComment: (id) =>
    set((s) => ({
      comments: s.comments.filter((c) => c.id !== id),
      totalCount: Math.max(0, s.totalCount - 1),
    })),

  addPending: (pending) =>
    set((s) => ({
      pendingComments: [...s.pendingComments, pending],
    })),

  promotePending: (tempId, real) =>
    set((s) => ({
      pendingComments: s.pendingComments.filter((p) => p.tempId !== tempId),
      comments: [...s.comments, real],
      totalCount: s.totalCount + 1,
    })),

  removePending: (tempId) =>
    set((s) => ({
      pendingComments: s.pendingComments.filter((p) => p.tempId !== tempId),
    })),

  setSelectedComment: (id) => set({ selectedCommentId: id }),
  setCommentPanelOpen: (open) => set({ commentPanelOpen: open }),
  setSortMode: (mode) => set({ sortMode: mode }),
  setReplyingTo: (id) => set({ replyingTo: id }),
  setTotalCount: (count) => set({ totalCount: count }),

  toggleThread: (id) =>
    set((s) => {
      const next = new Set(s.expandedThreads);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return { expandedThreads: next };
    }),

  reset: () => set(initialState),
}));
