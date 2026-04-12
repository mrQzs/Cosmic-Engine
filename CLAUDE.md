# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**CyberGeek** (project codename: **Cosmic-Engine**) is an immersive 3D space-themed blog where articles are planets, comments are satellites, categories are galaxies, and subcategories are stars that evolve through lifecycle stages. The site domain is `wo.city`.

## Architecture

Monorepo with three workspaces managed by **pnpm workspaces**:

- **`frontend/`** — Next.js 15 (App Router, Turbopack) + React 19 + TypeScript + React Three Fiber (R3F) + Drei + Three.js for 3D rendering, Zustand for state, Apollo Client for GraphQL, Tailwind CSS 4, GSAP for animations
- **`backend/`** — Go 1.24 + Fiber v2 HTTP framework, gqlgen for GraphQL, sqlc for type-safe SQL, pgx for PostgreSQL, go-redis for caching
- **`shared/`** — `@cosmic-engine/shared` TypeScript package with shared types, constants, and enums used by frontend

Data layer: PostgreSQL 17 + Redis 7 (with pgvector for semantic search). Database migrations via golang-migrate, SQL queries via sqlc code generation.

## Common Commands

```bash
# Install all workspace dependencies
pnpm install

# Frontend
cd frontend && pnpm dev          # Dev server (Next.js + Turbopack)
cd frontend && pnpm build        # Production build
cd frontend && pnpm lint         # ESLint

# Backend
cd backend && go mod download    # Fetch Go dependencies
cd backend && air                # Dev server with hot reload
cd backend && go build ./cmd/server  # Build server binary
cd backend && golangci-lint run  # Lint

# Code generation
sqlc generate                    # Generate Go code from SQL queries (in backend/)
go run github.com/99designs/gqlgen generate  # Generate GraphQL resolvers (in backend/)

# Database
docker compose up -d postgres redis   # Start dev databases
migrate -path migrations -database "$DATABASE_URL" up   # Run migrations

# Testing
cd frontend && pnpm vitest              # Run frontend unit tests
cd frontend && pnpm vitest run <file>   # Run a single test file
cd backend && go test ./...             # Run all backend tests
cd backend && go test ./internal/physics/...  # Run tests for a specific package
cd backend && go test -bench=. ./internal/physics/...  # Run benchmarks
pnpm playwright test                    # E2E tests
```

## Key Technical Conventions

### R3F / 3D Scene Rules

- **Delta time animations**: All `useFrame` incremental animations MUST multiply by `delta`. Use `clock.elapsedTime` for absolute-time animations (orbits). Never write bare `+= constant` in useFrame.
- **Zustand selectors**: Always use precise field selectors (`useStore(s => s.field)`), never subscribe to the entire store.
- **Refs over state in 3D**: Use `useRef` + direct mutation in `useFrame`, never `useState` for per-frame updates.
- **GPU resource disposal**: Manually `.dispose()` all textures/geometries/materials loaded via `useLoader`/`useTexture` in cleanup effects. R3F auto-dispose only covers direct JSX children.
- **Object pooling**: Use InstancedMesh + object pool pattern for particles/trails. Hide pooled items via zero-scale matrix, not create/destroy.
- **Shader warmup**: Pre-compile all custom GLSL shaders during loading phase via `renderer.compile()` to avoid first-use frame stalls.

### Event Throttling Policy

- `onPointerMove` in 3D scene: throttle to ~30fps (raycast is expensive)
- `window.resize`: debounce 200ms
- Scroll in article panel: throttle to ~10fps
- Search input: debounce 300ms
- WebSocket position sync: throttle 500ms

### Adaptive Quality (3 tiers)

High → Medium → Low. Auto-downgrade after 3s below 30fps, auto-upgrade after 10s above 55fps. DPR capped at 1.5 on high-res screens. No 2D fallback — devices that can't run the Low tier are shown an "unsupported device" message. Quality level is persisted to localStorage.

### Backend Conventions

- Go tests use table-driven style with `t.Parallel()` for pure functions
- Database integration tests use testcontainers-go (real PostgreSQL + Redis)
- Structured logging via zerolog
- Passwords hashed with Argon2id
- Distributed IDs via Sonyflake (Snowflake variant)

## Design System

Dark-only theme. Color palette: `cosmic-void` (#0a0a1a), `cosmic-glow` (#38bdf8), `cosmic-nebula` (#6b21a8), `cosmic-plasma` (#fb923c), `cosmic-frost` (#e2e8f0). Fonts: LXGW WenKai (Chinese body), Inter (Latin body), JetBrains Mono (code/HUD), Space Grotesk (headings). HUD panels use glassmorphism (backdrop-blur + border glow + subtle scanlines).

## Route Structure

| URL                       | Scene                               |
| ------------------------- | ----------------------------------- |
| `/`                       | Universe panorama                   |
| `/galaxy/[slug]`          | Fly to galaxy, focus black hole     |
| `/post/[slug]`            | Atmospheric entry → article reading |
| `/archive/[year]`         | Wormhole jump to year sector        |
| `/about`                  | Fly to pulsar (author bio)          |
| `/admin_199209173332/...` | Admin panel (obfuscated path)       |

## Development Phases

The project is built in 6 phases (see `docs/PLAN_01` through `PLAN_06`). Each phase has numbered sub-tasks. Reference files in `docs/预备文件/` contain pre-designed configs, schemas, shaders, and SQL migrations.
