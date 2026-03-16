<div align="center">

# Cosmic-Engine

### CyberGeek — CyberCode Chronicles

**You're not reading a blog. You're traversing the universe.**

<br/>

*Every article is a planet. Every comment is a satellite. Every category is a galaxy.*

[wo.city](https://wo.city)

</div>

---

## Vision

Cosmic-Engine is an immersive 3D space-themed blog system that reimagines web content as a living universe. Instead of browsing pages, visitors explore galaxies, orbit planets, and traverse wormholes — all while reading articles, leaving comments, and discovering related content through spatial relationships.

The blog evolves organically: subcategories are stars that progress through stellar lifecycles as they accumulate articles, from dim protostellar disks to brilliant red giants. Comments orbit their parent articles as satellites, forming spectacular ring systems around popular posts.

---

## Universe Hierarchy

```
Universe
│
├── Pulsar ──────────── Author bio (center of the universe)
│   └── Communication Satellites ─── Social links
│
├── Galaxy ──────────── Main category (e.g. "Magazine", "Novel")
│   │
│   ├── ● Supermassive Black Hole ── Galaxy core, gravitational anchor + overview
│   │
│   ├── ★ Star ──────── Subcategory (lifecycle driven by article count)
│   │   ├── 🌍 Planet ── Article
│   │   │   ├── 🌑 Satellite ── Comment
│   │   │   └── 🌑 Satellite ── Comment
│   │   └── 🌍 Planet ── Article
│   │
│   ├── ☁ Protostellar Disk ── Subcategory with < 10 articles
│   └── 🌌 Nebula Background ── Spiral arm particles
│
├── Wormhole Corridor ── Archive (one wormhole per year)
├── Asteroid Belt ────── Drafts & inspiration fragments
└── StarGate ─────────── Friend links
```

### Celestial Body Mapping

| Blog Concept | Celestial Object | Interaction |
|---|---|---|
| Main category | Galaxy + central black hole | Click black hole → holographic overview |
| Subcategory | Star (lifecycle: protostellar → main-sequence → giant → red giant) | Click → subcategory article list |
| Article | Planet (procedural texture based on content) | Click → atmospheric entry → reading |
| Comment | Satellite (orbital ring system) | Enter → HUD terminal → launch |
| Draft | Asteroid (irregular debris) | Click → quick view / collapse into article |
| Archive | Wormhole (torus + UV distortion) | Click → lightspeed jump to historical sector |
| About | Pulsar (spinning + polar beams) | Click → holographic scan |
| Friend link | StarGate (mini wormhole) | Hover preview → click to jump |

### Content-Driven Visual Mapping

Planet appearances encode article attributes — no need to read text to sense the content:

| Article Attribute | Visual Mapping |
|---|---|
| Word count | Planet type + size (rocky → terrestrial → gas giant) |
| Tags/category | Primary color (tech → cool blue, humanities → warm amber) |
| Code block ratio | Surface texture (code-heavy → circuit grid, narrative → organic terrain) |
| Comment count | Satellite ring density (few → lonely, 50+ → spectacular rings) |
| Article age | Surface roughness (new → smooth, old → weathered) |
| Recent activity | Glow intensity (active → bright atmosphere, dormant → dim) |

### Stellar Lifecycle

Subcategories evolve as they grow, transforming from dim gas clouds into brilliant stellar bodies:

| Stage | Trigger | Visual |
|---|---|---|
| Protostellar disk | articles < 10 | Dim rotating gas cloud, planets barely visible |
| Main-sequence star | articles ≥ 10 | Bright self-luminous sphere, warm yellow, corona halo |
| Giant star | articles ≥ 50 | Size ×1.5, orange tint, more violent convection |
| Red giant | articles ≥ 100 | Size ×2.5, deep red, stellar wind particle ejection |

When a subcategory reaches 10 articles, a **Star Ignition** animation plays — particles collapse inward, a shockwave expands outward, and a new star is born.

---

## Core Experiences

### Cosmic Exploration

The homepage presents a deep space panorama with galaxies scattered in 3D space. Navigate with mouse drag/scroll (Google Earth style), click any celestial body for a smooth 3-5 second camera flight. Progressive detail reveals: far = galaxy glow blobs, mid = stars visible, near = planets with labels and constellation lines.

### Atmospheric Entry (Reading)

Clicking a planet triggers a cinematic 3-second sequence:

1. **Acceleration** (1s) — Camera rushes toward the planet
2. **Cloud penetration** (0.5s) — Bloom + glitch + chromatic aberration
3. **Dimensional reduction** (0.5s) — Surface dissolves into Voronoi cell grid
4. **Landing** — 2D article panel embedded in 3D scene (glassmorphism, 70% width)

The reading panel supports full Markdown with math (KaTeX), Mermaid diagrams, interactive code sandboxes (Sandpack), callout blocks, and syntax-highlighted code (One Dark Pro).

### Satellite Launch (Commenting)

1. Press Enter → Ship HUD terminal slides out (monospace font + scanlines)
2. Type comment (full Markdown support)
3. Click **"Launch"**
4. HUD collapses into a light beam → curves toward the planet → gravitational capture → crystallizes into a new satellite

### Wormhole Time Travel

Wormholes arranged along a spiral corridor, newest year closest. Clicking triggers a lightspeed jump sequence with star-streak radial blur, white flash, and arrival at a historical sector rendered with weathered textures and desaturated tones.

---

## Tech Stack

### Frontend

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, Turbopack) |
| Language | TypeScript, React 19 |
| 3D Engine | Three.js + React Three Fiber + Drei |
| Post-processing | @react-three/postprocessing (Bloom, ChromaticAberration, Glitch) |
| Animation | GSAP (camera flights, UI transitions, GLSL-driven effects) |
| State | Zustand (navigation, scene, UI, audio, quality, auth stores) |
| Data | Apollo Client (GraphQL), WebSocket |
| Styling | Tailwind CSS 4 + custom cosmic theme CSS variables |
| Markdown | react-markdown + remark-gfm + remark-math + rehype-katex + rehype-highlight |
| Code sandbox | Sandpack (@codesandbox/sandpack-react) |
| Code editor | Monaco Editor (admin panel) |
| Audio | Howler.js / Web Audio API |
| Workers | Comlink (offload octree, markdown parsing, search to Web Workers) |
| PWA | next-pwa / Workbox |
| i18n | next-intl |
| Performance | web-vitals, Stats.js, r3f-perf |

### Backend

| Layer | Technology |
|---|---|
| Language | Go 1.24 |
| Web framework | Fiber v2 |
| GraphQL | gqlgen + DataLoader |
| REST API | Fiber RESTful routes + Swagger (swaggo) |
| Database | PostgreSQL 17 (pgvector, zhparser, JSONB) |
| SQL codegen | sqlc |
| Migrations | golang-migrate |
| Cache | Redis 7 (Redis Stack: Bloom Filter + JSON modules) |
| Auth | JWT (golang-jwt) + Argon2id + TOTP (pquerna/otp) |
| Config | Viper |
| Validation | go-playground/validator + bluemonday (XSS) |
| WebSocket | gorilla/websocket + Redis Pub/Sub |
| Logging | zerolog (structured JSON) |
| IDs | UUIDv7 (google/uuid) |
| Search | PostgreSQL tsvector + zhparser / Meilisearch (optional) |

### Infrastructure

| Layer | Technology |
|---|---|
| Containers | Docker + Docker Compose |
| Reverse proxy | Nginx (Gzip/Brotli, HTTPS, security headers, WebSocket) |
| SSL | Let's Encrypt (wildcard via DNS-01) |
| Object storage | Cloudflare R2 / AWS S3 |
| CDN | Cloudflare |
| CI/CD | GitHub Actions (lint, test, build, Lighthouse, bundle check, deploy) |
| Monitoring | Sentry (errors), Prometheus + Grafana (optional), Umami/Plausible (analytics) |

---

## Design System

**Dark-only** — the universe is naturally dark.

### Color Palette

| Name | Hex | Usage |
|---|---|---|
| `cosmic-void` | `#0a0a1a` | Deep space background |
| `cosmic-glow` | `#38bdf8` | Primary accent, HUD borders, highlights |
| `cosmic-nebula` | `#6b21a8` | Secondary, nebula purple |
| `cosmic-plasma` | `#fb923c` | Emphasis, action buttons |
| `cosmic-frost` | `#e2e8f0` | Body text |
| `cosmic-crt` | `#00d4ff` | CRT terminal ice-blue |

### Typography

| Usage | Font |
|---|---|
| Chinese body | LXGW WenKai (霞鹜文楷) |
| Latin body | Inter |
| Code / HUD | JetBrains Mono |
| Headings | Space Grotesk |

### HUD Language

- Glassmorphism panels (backdrop-blur + glowing borders)
- Dotted/neon borders with glow effects
- Subtle scanline overlays
- Particle-condensation panel entrance animations

---

## Routes

| URL | Scene |
|---|---|
| `/` | Universe panorama (far view) |
| `/galaxy/[slug]` | Fly to galaxy, focus central black hole |
| `/post/[slug]` | Atmospheric entry → article reading |
| `/archive/[year]` | Wormhole jump to year sector |
| `/about` | Fly to pulsar (author bio) |
| `/admin_199209173332/...` | Admin panel (obfuscated path) |
| `?cam=x,y,z` | Shareable camera position |

---

## Project Structure

```
Cosmic-Engine/
├── frontend/          Next.js 15 app (App Router)
│   ├── app/           Pages & layouts
│   │   ├── (blog)/    Blog routes (articles, categories, tags, archives, search, about, friends)
│   │   ├── (admin)/   Admin panel routes
│   │   └── api/       Next.js API routes (ISR revalidate, OG image generation)
│   ├── components/
│   │   ├── canvas/    3D scene components (Universe, Galaxy, Planet, Starfield, Wormhole, Pulsar, ...)
│   │   ├── ui/        2D HUD components (ArticleReader, CommentHUD, MiniMap, SearchOverlay, ...)
│   │   ├── fallback/  Error & 2D degradation views
│   │   └── admin/     Admin panel components
│   ├── hooks/         Custom React hooks (camera, audio, device capability, search, ...)
│   ├── stores/        Zustand state stores
│   ├── animations/    GSAP animation sequences
│   ├── shaders/       GLSL vertex/fragment shaders
│   ├── utils/         Utility functions (Apollo client, orbit calculator, color mapper, ...)
│   ├── workers/       Web Workers (orbit, search, physics)
│   └── styles/        Global CSS (cosmic theme, CRT effects, markdown, scrollbar, fonts)
│
├── backend/           Go 1.24 API service
│   ├── cmd/           Entry points (server, seed)
│   ├── internal/
│   │   ├── api/       HTTP handlers (REST v1 + health)
│   │   ├── auth/      JWT, TOTP, password hashing
│   │   ├── database/  PostgreSQL pool, migrations, ID generation
│   │   ├── middleware/ CORS, rate limit, logger, recovery, auth guard, cache
│   │   ├── physics/   Orbital allocation, aesthetics mapping, layout stabilizer
│   │   ├── cache/     Redis caching strategies
│   │   ├── search/    Full-text search (tsvector)
│   │   ├── ws/        WebSocket hub, client, message protocol
│   │   └── ...        (antispam, feed, export, upload, stats, notification, webhook, newsletter)
│   ├── graph/         gqlgen GraphQL (schema, resolvers, generated code)
│   ├── migrations/    SQL migration files
│   └── sqlc/          SQL queries → Go code generation
│
├── shared/            @cosmic-engine/shared TypeScript package
│   └── src/
│       ├── types/     Shared type definitions (article, comment, category, websocket, ...)
│       ├── constants/ Physics constants, theme colors, business limits
│       └── enums/     Article status, comment status, quality level
│
├── nginx/             Reverse proxy config (SSL, cache, gzip, security headers, WebSocket)
├── scripts/           Dev/ops scripts (setup, dev, build, deploy, backup, seed, codegen)
├── docs/              Design documents & implementation plans
└── .github/           CI/CD workflows
```

---

## Development

### Prerequisites

| Tool | Version |
|---|---|
| Node.js | 22 LTS |
| pnpm | 9.15+ |
| Go | 1.24 |
| Docker & Docker Compose | 27+ / 2.32+ |

### Quick Start

```bash
# Clone & install dependencies
git clone <repo-url> && cd Cosmic-Engine
pnpm install
cd backend && go mod download && cd ..

# Install Go dev tools
go install github.com/air-verse/air@latest
go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest
go install github.com/99designs/gqlgen@latest
go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest

# Start infrastructure
docker compose -f docker-compose.dev.yml up -d

# Run database migrations
cd backend && migrate -path migrations -database "$DATABASE_URL" up

# Start development servers
pnpm dev                          # Frontend: Next.js + Turbopack
cd backend && air                 # Backend: Go with hot reload
```

### Key Commands

```bash
# Frontend
pnpm dev                          # Dev server
pnpm build                        # Production build
pnpm lint                         # ESLint

# Backend
cd backend && air                 # Dev server (hot reload)
cd backend && go build ./cmd/server  # Build binary
cd backend && golangci-lint run   # Lint

# Code generation
cd backend && sqlc generate       # SQL → Go types
cd backend && go run github.com/99designs/gqlgen generate  # GraphQL → Go resolvers

# Database
docker compose -f docker-compose.dev.yml up -d    # Start PostgreSQL + Redis
docker compose -f docker-compose.dev.yml down -v   # Stop & clear data

# Testing
pnpm vitest                       # Frontend unit tests
pnpm vitest run <file>            # Single test file
cd backend && go test ./...       # All backend tests
cd backend && go test -race ./internal/physics/...  # Package tests with race detection
cd backend && go test -bench=. ./internal/physics/... # Benchmarks
pnpm playwright test              # E2E tests
```

---

## Performance Architecture

### Adaptive Quality (4 Tiers)

| Tier | Strategy | Trigger |
|---|---|---|
| High | Full effects + full particles + detailed shaders | Default |
| Medium | Disable some post-processing, halve particles | FPS < 30 for 3s |
| Low | Disable all post-processing, 1/4 particles, simplified materials | Continued low FPS |
| Ultra-low | 2D fallback view (CSS stars + card layout) | No WebGL2 support |

Auto-upgrade after 10s above 55 FPS. DPR capped at 1.5 on high-res screens.

### Progressive Scene Loading

| Phase | Time | Content |
|---|---|---|
| 1 | 0–500ms | Deep space background + nearest 2-3 galaxy blobs |
| 2 | 500ms–1.5s | All galaxies upgrade to particle-level + pulsar flashing |
| 3 | 1.5s–3s | Nearby galaxy planets rendered + raycast activated |
| 4 | 3s–10s | Off-screen galaxies load + shader warm-up |
| 5 | 10s+ | Asteroid belt fill + constellation lines + non-critical effects |

User interaction pauses background loading (frame rate priority).

### Frame Budget (16.67ms target)

| Stage | Budget |
|---|---|
| Physics/animation (useFrame) | ≤ 3ms |
| Raycasting (BVH-accelerated) | ≤ 1ms |
| React reconciliation | ≤ 2ms |
| GPU rendering | ≤ 10ms |
| Headroom | ~1ms |

### Key Optimizations

- **BVH-accelerated raycasting** — O(log n) instead of O(n) via three-mesh-bvh
- **InstancedMesh** — Single draw call for satellites, asteroids, particles
- **Geometry merging** — Orbit lines, constellation lines merged into single draw calls
- **Object pooling** — Pre-allocated particle pools for trails and explosions (zero GC pressure)
- **Shader pre-compilation** — All GLSL shaders warm up during loading screen
- **Web Workers** — Octree building, markdown parsing, search offloaded from main thread
- **Render Target** — Mini-map at 256×256 updated every 5 frames; wormhole preview on hover only

---

## Anti-Spam Defense (4 Layers)

| Layer | Mechanism |
|---|---|
| 1. Frontend PoW | SHA-256 hash challenge (~200ms for real users, 1000× cost for bots) |
| 2. Behavior analysis | Mouse trajectory entropy, keystroke rhythm, scroll patterns |
| 3. Content analysis | TF-IDF relevance check, SimHash duplicate detection, link blacklist |
| 4. Rate limiting | Redis sliding window — max 3 comments/minute per IP |

---

## Development Phases

| Phase | Milestone | Focus |
|---|---|---|
| **0–1** | [Init & Frontend Skeleton](docs/PLAN_01_初始化与前端骨架.md) | Monorepo, Docker, Next.js, R3F, Starfield, Camera, Zustand, Theme, PWA, A11y, Quality |
| **2–3** | [Backend API & Database](docs/PLAN_02_后端API与数据库.md) | Go/Fiber, GraphQL, REST, PostgreSQL, Redis, Physics engine, Search, RSS, Webhook |
| **4–5** | [Galaxy Rendering & Reading](docs/PLAN_03_星系渲染与文章阅读.md) | Galaxy/Planet rendering, Kepler orbits, Atmospheric entry, Markdown, TOC, Search 3D |
| **6–7** | [Comment Satellites & Asteroids](docs/PLAN_04_评论卫星与小行星带.md) | InstancedMesh satellites, Launch animation, Asteroid belt, Draft management |
| **8–10** | [Wormholes, Pulsar & Black Holes](docs/PLAN_05_虫洞脉冲星与黑洞.md) | Wormhole time travel, Pulsar bio, Raymarching black holes, Star lifecycle |
| **11–13** | [Realtime, SEO & Deployment](docs/PLAN_06_实时通信SEO与部署.md) | WebSocket, SSR/SSG, Performance, Docker production, Nginx, CI/CD, Monitoring |

---

## Database Schema (Core Tables)

| Table | Purpose |
|---|---|
| `users` | Authors/admins with TOTP support |
| `galaxies` | Categories (parent_id=NULL) & subcategories/stars (parent_id≠NULL), self-referencing |
| `celestial_bodies` | Articles (PLANET), drafts (ASTEROID), bio (PULSAR) — with pgvector embedding, tsvector FTS |
| `comments` | Nested comments with orbital parameters for 3D visualization |
| `tags` / `body_tags` | Tag system with many-to-many relation |
| `reactions` | Emoji reactions with session-based deduplication |
| `article_versions` | Edit history snapshots with diff support |
| `subscribers` | Newsletter with double opt-in |
| `uploads` | Media files with BlurHash placeholders |
| `friend_links` | Friend links rendered as StarGates |
| `webhook_configs` | Event-driven webhook integrations |
| `site_settings` | Key-value site configuration (JSONB) |

All tables use **UUIDv7** primary keys (time-ordered, B-Tree friendly).

---

## License

TBD

---

<div align="center">

**This isn't just a blog. It's a universe that evolves with your knowledge.**

</div>
