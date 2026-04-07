// ─── Primitives ─────────────────────────────────────────

export interface BaseCoordinates {
  x: number;
  y: number;
  z: number;
}

export interface HSLColor {
  h: number;
  s: number;
  l: number;
}

// ─── Physics & Aesthetics ───────────────────────────────

export interface PhysicsParams {
  mass: number;
  orbitRadius: number;
  eccentricity: number;
  orbitInclination: number;
  phaseOffset: number;
  orbitalSpeed: number;
  textureSeed: number;
}

export interface OrbitalParams {
  ringIndex: number;
  orbitRadius: number;
  inclination: number;
  phaseOffset: number;
  eccentricity: number;
  orbitalSpeed: number;
}

export interface AestheticsParams {
  planetType: string;
  baseColorHSL: HSLColor;
  atmosphereColor: string | null;
  surfaceRoughness: number;
  hasRing: boolean;
  glowIntensity: number;
  noiseType: string;
}

export interface GalaxyColorScheme {
  primary: string;
  secondary: string;
  nebula?: string;
}

// ─── Domain Entities ────────────────────────────────────

export type StarPhase = 'PROTOSTAR' | 'MAIN_SEQUENCE' | 'GIANT' | 'RED_GIANT';

export interface Tag {
  id: string;
  name: string;
  slug: string;
  color: string;
  postCount: number;
}

export interface Galaxy {
  id: string;
  name: string;
  slug: string;
  description?: string;
  position: BaseCoordinates;
  colorScheme: GalaxyColorScheme;
  parentId?: string;
  articleCount: number;
  starPhase?: StarPhase;
  createdAt: string;
  updatedAt: string;
}

export interface Planet {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  coverUrl?: string;
  galaxyId?: string;
  physicsParams?: PhysicsParams;
  aestheticsParams?: AestheticsParams;
  content: string;
  readingTime: number;
  pinned: boolean;
  publishedAt?: string;
  tags: Tag[];
  viewCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Reaction {
  id: string;
  targetId: string;
  emoji: string;
  count: number;
}

export interface Comment {
  id: string;
  bodySlug: string;
  authorName: string;
  authorEmail?: string;
  authorUrl?: string;
  avatarSeed: string;
  contentHtml: string;
  orbitalParams?: OrbitalParams;
  parentId?: string;
  replies: Comment[];
  reactions: Reaction[];
  pinned: boolean;
  createdAt: string;
}

export type UserRole = 'ADMIN' | 'EDITOR';

export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  role: UserRole;
  lastLoginAt?: string;
  createdAt: string;
}

// ─── API Response Wrappers ──────────────────────────────

export interface ApiError {
  message: string;
  path?: string[];
}

export interface ApiResponse<T> {
  data: T;
  errors?: ApiError[];
}

export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor?: string;
  endCursor?: string;
}

export interface Edge<T> {
  cursor: string;
  node: T;
}

export interface PaginatedResponse<T> {
  edges: Edge<T>[];
  pageInfo: PageInfo;
  totalCount: number;
}
