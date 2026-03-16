# CyberGeek 宇宙博客 — 第三方依赖清单

> 所有版本号为截至 2025 年 5 月的最新稳定版本
> 标注 `(Phase X.Y)` 对应开发阶段

---

## 前端依赖（frontend/package.json）

### 1. 核心框架

| 包名 | 版本 | 用途 | Phase |
|------|------|------|-------|
| `next` | ^15.1.0 | React 全栈框架（App Router + Turbopack） | Phase 1.0 |
| `react` | ^19.0.0 | UI 组件库 | Phase 1.0 |
| `react-dom` | ^19.0.0 | React DOM 渲染器 | Phase 1.0 |
| `typescript` | ^5.7.0 | TypeScript 编译器 | Phase 1.0 |

### 2. 3D 引擎

| 包名 | 版本 | 用途 | Phase |
|------|------|------|-------|
| `three` | ^0.172.0 | WebGL 3D 渲染引擎 | Phase 1.1 |
| `@react-three/fiber` | ^9.0.0 | Three.js React 声明式渲染器 | Phase 1.1 |
| `@react-three/drei` | ^10.0.0 | R3F 实用组件集（轨道控制、文字、加载器等） | Phase 1.1 |
| `@react-three/postprocessing` | ^3.0.0 | 后处理效果（Bloom、色差、噪点） | Phase 1.3 |
| `three-mesh-bvh` | ^0.8.0 | BVH 加速射线检测（鼠标拾取优化） | Phase 2.4 |

### 3. 动画

| 包名 | 版本 | 用途 | Phase |
|------|------|------|-------|
| `gsap` | ^3.12.0 | 高性能动画引擎（相机飞行、UI 过渡） | Phase 1.3 |

### 4. 状态管理

| 包名 | 版本 | 用途 | Phase |
|------|------|------|-------|
| `zustand` | ^5.0.0 | 轻量级状态管理（导航、场景、UI 状态） | Phase 1.1 |

### 5. 数据通信

| 包名 | 版本 | 用途 | Phase |
|------|------|------|-------|
| `@apollo/client` | ^3.12.0 | GraphQL 客户端（查询、缓存、订阅） | Phase 2.0 |
| `graphql` | ^16.10.0 | GraphQL 核心解析库 | Phase 2.0 |

### 6. UI 与样式

| 包名 | 版本 | 用途 | Phase |
|------|------|------|-------|
| `tailwindcss` | ^4.0.0 | 原子化 CSS 框架 | Phase 1.0 |
| `@tailwindcss/typography` | ^0.5.0 | Tailwind 排版插件（Markdown 正文） | Phase 2.0 |
| `lxgw-wenkai-webfont` | ^1.7.0 | 霞鹜文楷 Webfont（中文正文字体） | Phase 1.0 |

### 7. Markdown 渲染与扩展

| 包名 | 版本 | 用途 | Phase |
|------|------|------|-------|
| `react-markdown` | ^9.0.0 | Markdown 转 React 组件渲染器 | Phase 2.0 |
| `remark-gfm` | ^4.0.0 | GitHub 风格 Markdown 扩展（表格、任务列表） | Phase 2.0 |
| `remark-math` | ^6.0.0 | Markdown 数学公式语法支持 | Phase 2.6 |
| `rehype-katex` | ^7.0.0 | KaTeX 数学公式渲染 | Phase 2.6 |
| `rehype-highlight` | ^7.0.0 | 代码块语法高亮 | Phase 2.0 |
| `mermaid` | ^11.4.0 | 流程图/时序图渲染引擎 | Phase 2.6 |
| `@codesandbox/sandpack-react` | ^2.19.0 | 交互式代码沙盒组件 | Phase 2.6 |
| `@monaco-editor/react` | ^4.7.0 | Monaco 代码编辑器 React 封装 | Phase 4.2 |

### 8. 国际化

| 包名 | 版本 | 用途 | Phase |
|------|------|------|-------|
| `next-intl` | ^4.0.0 | Next.js 国际化方案（中英文切换） | Phase 3.8 |

### 9. PWA

| 包名 | 版本 | 用途 | Phase |
|------|------|------|-------|
| `next-pwa` | ^5.6.0 | Next.js PWA 插件（Service Worker、离线缓存） | Phase 4.5 |

### 10. 工具库

| 包名 | 版本 | 用途 | Phase |
|------|------|------|-------|
| `lodash-es` | ^4.17.21 | ES Module 工具函数集（throttle、debounce 等） | Phase 1.0 |
| `dayjs` | ^1.11.0 | 轻量日期处理库 | Phase 2.0 |
| `qrcode` | ^1.5.0 | 二维码生成（分享功能） | Phase 2.5 |
| `howler` | ^2.2.0 | 跨浏览器音频播放引擎 | Phase 3.4 |
| `comlink` | ^4.4.0 | Web Worker 通信简化库（类型安全 RPC） | Phase 2.4 |

### 11. 性能监控与开发工具

| 包名 | 版本 | 用途 | Phase |
|------|------|------|-------|
| `web-vitals` | ^4.2.0 | Core Web Vitals 性能指标采集 | Phase 4.5 |
| `stats.js` | ^0.17.0 | FPS/内存实时监控面板（开发环境） | Phase 1.3 |
| `r3f-perf` | ^8.0.0 | R3F 性能监控（Draw Calls、三角面数） | Phase 1.3 |

### 12. 前端开发依赖（devDependencies）

| 包名 | 版本 | 用途 | Phase |
|------|------|------|-------|
| `@types/react` | ^19.0.0 | React 类型定义 | Phase 1.0 |
| `@types/react-dom` | ^19.0.0 | React DOM 类型定义 | Phase 1.0 |
| `@types/three` | ^0.172.0 | Three.js 类型定义 | Phase 1.1 |
| `@types/lodash-es` | ^4.17.0 | lodash-es 类型定义 | Phase 1.0 |
| `@types/howler` | ^2.2.0 | Howler.js 类型定义 | Phase 3.4 |
| `@types/qrcode` | ^1.5.0 | qrcode 类型定义 | Phase 2.5 |
| `eslint` | ^9.0.0 | JavaScript/TypeScript 代码检查 | Phase 1.0 |
| `eslint-config-next` | ^15.1.0 | Next.js ESLint 预设规则 | Phase 1.0 |
| `prettier` | ^3.4.0 | 代码格式化工具 | Phase 1.0 |
| `@graphql-codegen/cli` | ^5.0.0 | GraphQL 代码生成 CLI | Phase 2.0 |
| `@graphql-codegen/typescript` | ^4.1.0 | GraphQL TypeScript 类型生成 | Phase 2.0 |
| `@graphql-codegen/typescript-operations` | ^4.4.0 | GraphQL 操作类型生成 | Phase 2.0 |
| `@graphql-codegen/typescript-react-apollo` | ^4.3.0 | Apollo React Hook 生成 | Phase 2.0 |

---

## 后端依赖（backend/go.mod）

### 1. Web 框架

| 包名 | 版本 | 用途 | Phase |
|------|------|------|-------|
| `github.com/gofiber/fiber/v2` | v2.52.0 | 高性能 HTTP 框架（路由、中间件） | Phase 1.0 |
| `github.com/gofiber/contrib/websocket` | v1.3.0 | Fiber WebSocket 适配器 | Phase 3.7 |

### 2. GraphQL

| 包名 | 版本 | 用途 | Phase |
|------|------|------|-------|
| `github.com/99designs/gqlgen` | v0.17.60 | GraphQL Go 代码生成器与运行时 | Phase 2.0 |
| `github.com/vektah/gqlparser/v2` | v2.5.20 | GraphQL Schema 解析器（gqlgen 依赖） | Phase 2.0 |

### 3. 数据库

| 包名 | 版本 | 用途 | Phase |
|------|------|------|-------|
| `github.com/jackc/pgx/v5` | v5.7.0 | PostgreSQL 驱动（高性能、原生协议） | Phase 1.0 |
| `github.com/jackc/pgx/v5/pgxpool` | v5.7.0 | PostgreSQL 连接池 | Phase 1.0 |
| `github.com/sqlc-dev/sqlc` | v1.28.0 | SQL 到 Go 类型安全代码生成器（CLI 工具） | Phase 1.0 |
| `github.com/golang-migrate/migrate/v4` | v4.18.0 | 数据库迁移管理工具 | Phase 1.0 |

### 4. 缓存

| 包名 | 版本 | 用途 | Phase |
|------|------|------|-------|
| `github.com/redis/go-redis/v9` | v9.7.0 | Redis 客户端（缓存、速率限制、会话） | Phase 1.5 |

### 5. 安全与认证

| 包名 | 版本 | 用途 | Phase |
|------|------|------|-------|
| `github.com/golang-jwt/jwt/v5` | v5.2.0 | JWT Token 签发与验证 | Phase 4.0 |
| `github.com/pquerna/otp` | v1.4.0 | TOTP 二步验证生成与校验 | Phase 4.0 |
| `golang.org/x/crypto` | v0.31.0 | 密码学工具（Argon2id 密码哈希） | Phase 4.0 |
| `github.com/microcosm-cc/bluemonday` | v1.0.27 | HTML 清理/XSS 防护 | Phase 2.2 |

### 6. WebSocket

| 包名 | 版本 | 用途 | Phase |
|------|------|------|-------|
| `github.com/gorilla/websocket` | v1.5.3 | WebSocket 协议实现 | Phase 3.7 |

### 7. 配置与校验

| 包名 | 版本 | 用途 | Phase |
|------|------|------|-------|
| `github.com/spf13/viper` | v1.19.0 | 配置文件加载（YAML、环境变量、远程配置） | Phase 1.0 |
| `github.com/go-playground/validator/v10` | v10.23.0 | 结构体字段校验（请求参数验证） | Phase 1.0 |

### 8. 工具库

| 包名 | 版本 | 用途 | Phase |
|------|------|------|-------|
| `github.com/google/uuid` | v1.6.0 | UUID 生成器 | Phase 1.0 |
| `github.com/rs/zerolog` | v1.33.0 | 高性能结构化 JSON 日志 | Phase 1.0 |
| `github.com/gorilla/feeds` | v1.2.0 | RSS/Atom Feed 生成 | Phase 4.5 |
| `github.com/disintegration/imaging` | v1.6.2 | 图片处理（缩放、裁剪、格式转换） | Phase 4.4 |
| `github.com/ulule/limiter/v3` | v3.11.2 | 速率限制器（配合 Redis） | Phase 1.5 |
| `github.com/sony/sonyflake` | v1.2.0 | 分布式 ID 生成（Snowflake 变体） | Phase 1.0 |

### 9. 测试

| 包名 | 版本 | 用途 | Phase |
|------|------|------|-------|
| `github.com/stretchr/testify` | v1.10.0 | 断言与 Mock 测试工具 | Phase 1.0 |
| `github.com/DATA-DOG/go-sqlmock` | v1.5.2 | SQL Mock（数据库层单元测试） | Phase 2.0 |

---

## 基础设施依赖

### Docker 镜像

| 镜像 | 版本标签 | 用途 | Phase |
|------|----------|------|-------|
| `node` | 22-alpine | 前端构建与运行基础镜像 | Phase 5.0 |
| `golang` | 1.24-alpine | 后端构建基础镜像 | Phase 5.0 |
| `postgres` | 17-alpine | PostgreSQL 数据库 | Phase 1.0 |
| `redis` | 7-alpine | Redis 缓存服务 | Phase 1.5 |
| `nginx` | 1.27-alpine | 反向代理与静态文件服务 | Phase 5.0 |

### CLI 工具（开发环境）

| 工具 | 版本 | 用途 | Phase |
|------|------|------|-------|
| `pnpm` | ^9.15.0 | 包管理器（Monorepo workspace） | Phase 1.0 |
| `sqlc` | v1.28.0 | SQL 代码生成 CLI | Phase 1.0 |
| `gqlgen` | v0.17.60 | GraphQL 代码生成 CLI | Phase 2.0 |
| `golang-migrate` | v4.18.0 | 数据库迁移 CLI | Phase 1.0 |
| `air` | v1.61.0 | Go 热重载开发工具 | Phase 1.0 |

---

## 版本兼容性说明

| 运行环境 | 最低版本 | 推荐版本 |
|----------|----------|----------|
| Node.js | 20 LTS | 22 LTS |
| Go | 1.23 | 1.24 |
| PostgreSQL | 15 | 17 |
| Redis | 7.0 | 7.4 |
| pnpm | 9.0 | 9.15+ |
| Docker | 24.0 | 27.0+ |
| Docker Compose | 2.20 | 2.32+ |

---

## 安装命令速查

```bash
# 根目录初始化（安装所有 workspace 依赖）
pnpm install

# 后端依赖
cd backend && go mod download

# 开发工具安装
go install github.com/air-verse/air@latest
go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest
go install github.com/99designs/gqlgen@latest
go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest

# 启动开发环境
docker compose up -d postgres redis
pnpm dev          # 前端 (Next.js + Turbopack)
cd backend && air # 后端 (热重载)
```
