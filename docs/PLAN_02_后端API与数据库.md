# Phase 2-3: 后端 API 服务与数据库缓存层

> 涵盖 Go 后端搭建、GraphQL API、RESTful 公开 API、RSS Feed、Webhook 集成、PostgreSQL 数据库、Redis 缓存、物理参数计算。

---

## Phase 2: 后端 API 服务搭建

### 2.1 Go 项目初始化
- **任务**：创建 `backend/` Go module；选择 Web 框架（Fiber 或 Gin）；搭建项目目录结构（`cmd/`、`internal/`、`pkg/`、`api/`）
- **技术**：Go 1.22+、Fiber v2（或 Gin）
- **产出**：`backend/` 目录，`go.mod`，可编译运行的空 HTTP 服务

### 2.1.1 后端配置加载
- **任务**：建立统一的后端配置管理机制：
  - 使用 Viper 加载配置，优先级：环境变量 > `.env` 文件 > `config.yaml` 默认值
  - 配置结构体化：定义 `Config` struct（`ServerConfig`、`DatabaseConfig`、`RedisConfig`、`AuthConfig`、`SMTPConfig` 等子结构），启动时一次性校验必填项
  - 支持热重载（可选）：监听 `config.yaml` 变更，运行时动态更新非关键配置（如限流阈值、缓存 TTL）
  - 敏感配置（密钥、密码）只从环境变量读取，不落入配置文件
- **技术**：Viper、Go struct tags 校验（validator）、`os.Getenv`
- **产出**：`backend/internal/config/` 配置模块；`backend/config.example.yaml` 配置模板

### 2.1.2 优雅关停与信号处理
- **任务**：实现生产级的服务关停流程：
  - 监听 `SIGINT`、`SIGTERM` 信号，触发优雅关停
  - 关停顺序：① 停止接收新请求（从负载均衡摘除）② 等待进行中的 HTTP 请求完成（超时 30s 强制关闭）③ 关闭 WebSocket 连接（发送 Close Frame）④ 刷新 Redis 写缓冲 ⑤ 关闭数据库连接池 ⑥ 刷新日志缓冲
  - 健康检查端点在关停期间返回 503，通知上游停止转发流量
  - 启动日志输出服务版本号、监听地址、配置摘要
- **技术**：Go `os/signal`、`context.WithTimeout`、Fiber `Shutdown()`
- **产出**：`backend/cmd/server/main.go` 中的信号处理和关停逻辑

### 2.2 GraphQL Schema 设计
- **任务**：使用 `gqlgen` 定义 GraphQL Schema：`Universe`、`Galaxy`（含 StarPhase 恒星生命周期枚举）、`CelestialBody`（union: Planet/Asteroid/Pulsar）类型；定义 Query（universe、galaxy、planet、searchBodies 等）和 Mutation（createPlanet、createComment、createGalaxy 等）
- **技术**：gqlgen、GraphQL SDL
- **产出**：`backend/graph/schema.graphqls`，自动生成的 resolver 骨架

### 2.3 GraphQL Resolver 实现
- **任务**：实现各 resolver 的数据获取逻辑（先用内存 mock 数据）；支持嵌套查询（Galaxy -> Planets -> Satellites）；实现 DataLoader 避免 N+1 查询
- **技术**：gqlgen resolvers、dataloaden
- **产出**：`backend/graph/resolver.go` 等文件，可用 GraphQL Playground 调试

### 2.4 中间件与安全
- **任务**：实现 CORS 中间件（允许前端域名）；实现 Rate Limiting 中间件（令牌桶算法，防刷评论）；实现请求日志中间件（结构化 JSON 日志）
- **技术**：Fiber middleware、Go slog、令牌桶限流
- **产出**：`backend/internal/middleware/` 目录下的中间件组件

### 2.4.1 统一错误处理与响应格式
- **任务**：建立全局统一的 API 错误处理机制：
  - 统一响应包装：所有 API 返回 `{ "code": 0, "message": "ok", "data": {...} }` 格式；错误时 `{ "code": 40001, "message": "...", "details": [...] }`
  - 错误码体系：按模块分段——`400xx` 请求校验错误、`401xx` 认证错误、`403xx` 权限错误、`404xx` 资源不存在、`500xx` 服务端内部错误
  - 全局错误恢复中间件：捕获 panic，返回 500 而非进程崩溃；生产环境隐藏错误堆栈，开发环境输出详细信息
  - GraphQL 错误映射：gqlgen 错误统一转换为上述错误码格式，前端可据此展示对应 UI 反馈
  - 错误日志关联：每个请求分配 `request_id`（UUID），错误日志携带 request_id 便于追踪
- **技术**：Fiber error handler、Go 自定义 error 类型、slog 结构化日志、UUID request_id
- **产出**：`backend/internal/errors/` 错误定义与处理模块；`backend/internal/middleware/recovery.go` panic 恢复中间件；`backend/internal/middleware/request_id.go` 请求 ID 中间件

### 2.4.2 输入校验层
- **任务**：在请求到达业务逻辑之前统一校验和清洗输入数据：
  - 结构体校验：使用 `go-playground/validator` 对请求体进行声明式校验（required、min/max 长度、email 格式、URL 格式等）
  - XSS 过滤：评论、文章标题等用户输入经过 HTML 转义（`bluemonday` 策略——允许 Markdown 但过滤 `<script>` 等危险标签）
  - SQL 注入防护：ORM/sqlc 参数化查询天然防护，但搜索关键词等拼接场景需额外转义
  - 文件上传校验：限制文件类型（白名单：jpg/png/gif/webp/svg）、大小上限（单文件 10MB）
  - 校验失败返回统一错误格式，包含具体字段和原因（`{ "field": "title", "reason": "最少 2 个字符" }`）
- **技术**：go-playground/validator、bluemonday（HTML 净化）、自定义校验规则
- **产出**：`backend/internal/validator/` 校验模块；请求 DTO 结构体带校验 tag

### 2.4.3 健康检查端点
- **任务**：提供服务健康状态检测端点，供 Docker、负载均衡器和监控系统使用：
  - `GET /health` — 存活探针（Liveness）：服务进程正常即返回 `200 {"status": "ok"}`
  - `GET /ready` — 就绪探针（Readiness）：检查下游依赖是否就绪——PostgreSQL 连接可用、Redis 连接可用、全部通过才返回 200，否则返回 503 并列出不可用的依赖
  - `GET /health/detail`（需管理员认证）— 详细健康信息：服务版本、uptime、Go runtime 信息（goroutine 数、内存占用）、数据库连接池状态（活跃/空闲/等待连接数）、Redis 延迟
  - Docker Compose 中配置 `healthcheck` 引用 `/health` 端点
- **技术**：Fiber 路由、database/sql ping、go-redis ping
- **产出**：`backend/internal/api/health.go` 健康检查控制器；`docker-compose.*.yml` 中的 healthcheck 配置

### 2.5 管理后台 API（认证）
- **任务**：实现博主登录接口（JWT 签发）；实现管理权限校验中间件；管理接口：CRUD 文章、管理评论、管理草稿
- **技术**：JWT（golang-jwt）、Argon2id 密码哈希（`golang.org/x/crypto/argon2`，推荐参数 time=3, memory=64MB, threads=4；Argon2id 为 PHC 竞赛冠军，同时抗 GPU 暴力破解和侧信道攻击，安全性优于 bcrypt）
- **产出**：`backend/internal/auth/` 认证模块，受保护的管理 API 端点

### 2.6 RESTful 公开 API
- **任务**：在 GraphQL 之外提供一套 RESTful JSON API，方便第三方工具和脚本集成：
  - `GET /api/v1/posts` — 文章列表（分页、按星系/标签/时间筛选）
  - `GET /api/v1/posts/:slug` — 获取单篇文章详情（含元信息、物理参数）
  - `POST /api/v1/posts` — 创建/发布文章（需 API Key 认证）
  - `PUT /api/v1/posts/:slug` — 更新文章内容
  - `DELETE /api/v1/posts/:slug` — 删除文章
  - `GET /api/v1/galaxies` — 获取星系列表
  - `GET /api/v1/comments?post=:slug` — 获取指定文章的评论列表
  - 支持 `Accept: application/json` 和 `Accept: text/markdown` 两种响应格式（JSON 结构化数据 或 原始 Markdown 正文）
- **技术**：Fiber/Gin RESTful 路由、API Key 中间件（Bearer Token）、OpenAPI/Swagger 文档自动生成（swaggo）
- **产出**：`backend/internal/api/v1/` RESTful 控制器；`/api/v1/docs` Swagger 文档页面；支持 CLI 工具、Obsidian 插件、自定义脚本等外部方式发布和获取文章

### 2.7 RSS / Atom Feed
- **任务**：生成标准 RSS 2.0 和 Atom 1.0 Feed，让用户可通过 RSS 阅读器订阅博客：
  - `GET /feed.xml` — 全站最新文章 RSS Feed（默认最近 20 篇）
  - `GET /feed/galaxy/:slug.xml` — 按星系（分类）过滤的 Feed
  - `GET /feed/atom.xml` — Atom 1.0 格式备选
  - Feed 内容包含：文章标题、摘要（前 300 字）、全文（可配置）、发布时间、作者、文章永久链接
  - 新文章发布或更新时自动刷新 Feed 缓存（Redis 缓存 + 写穿透失效）
- **技术**：Go gorilla/feeds 库（或手动拼接 XML）、Redis 缓存、`Content-Type: application/rss+xml`
- **产出**：`backend/internal/feed/` Feed 生成模块；前端 `<head>` 中添加 `<link rel="alternate" type="application/rss+xml">` 自动发现标签

### 2.8 Webhook 与外部集成
- **任务**：支持文章生命周期事件的 Webhook 推送，实现博客与外部平台联动：
  - 管理后台可配置 Webhook URL 列表（支持多个目标）
  - 触发事件：`post.published`（文章发布）、`post.updated`（文章更新）、`comment.created`（新评论）
  - Webhook 请求体包含事件类型、文章/评论数据摘要、时间戳；请求头携带 HMAC-SHA256 签名供接收方验证
  - 内置集成模板：Telegram Bot 通知、Discord Webhook、Slack Incoming Webhook
  - 异步发送（goroutine + 重试队列），失败自动重试 3 次，记录发送日志
- **技术**：Go net/http、HMAC-SHA256 签名、goroutine 异步队列、管理后台配置存储
- **产出**：`backend/internal/webhook/` Webhook 分发模块；管理后台 Webhook 配置页面；支持博客发布自动同步到社交平台/通知渠道

### 2.9 全文搜索服务
- **任务**：实现博客全站全文搜索，支持中英文混合内容：
  - 方案 A（轻量）：使用 PostgreSQL 内置全文检索——`tsvector` + `tsquery`，中文分词使用 `pg_jieba` 或 `zhparser` 扩展
  - 方案 B（进阶）：集成 Meilisearch 独立搜索引擎，文章发布/更新时异步同步索引
  - 搜索 API：`GET /api/v1/search?q=关键词&galaxy=:slug&page=1`
  - 返回结果包含：匹配文章列表、高亮摘要片段（`<mark>` 标记命中词）、匹配的天体 ID（供前端 3D 场景高亮定位）
  - 支持搜索建议 / 自动补全（前缀匹配）
- **技术**：PostgreSQL tsvector / Meilisearch、中文分词、Go 异步索引同步
- **产出**：`backend/internal/search/` 搜索模块；前端搜索结果可联动 3D 场景高亮对应天体

### 2.10 邮件订阅 / Newsletter
- **任务**：实现邮件订阅功能，用户可通过邮箱订阅博客更新：
  - `POST /api/v1/subscribe` — 提交邮箱，发送确认邮件（Double Opt-in）
  - `GET /api/v1/subscribe/confirm/:token` — 确认订阅
  - `POST /api/v1/unsubscribe/:token` — 取消订阅
  - 文章发布时自动向订阅者发送通知邮件（包含文章标题、摘要、链接）
  - 邮件模板采用宇宙主题视觉风格（深色背景、星空点缀）
  - 支持频率控制：即时通知 / 每日摘要 / 每周汇总
- **技术**：Go gomail / SMTP、邮件模板（html/template）、JWT 确认令牌、Cron 定时汇总
- **产出**：`backend/internal/newsletter/` 订阅模块；宇宙主题邮件模板

### 2.11 文章版本历史
- **任务**：每次文章编辑保存时自动创建历史快照：
  - `article_versions` 表（id, body_id FK, content, physics_params, version_num, created_at, change_summary）
  - 管理后台可查看文章修改历史时间线
  - 支持任意两个版本的 diff 对比（后端生成 unified diff，前端高亮渲染）
  - 支持一键回滚到历史版本（创建新版本指向旧内容）
  - 自动清理策略：保留最近 50 个版本，超过的按时间稀疏保留
- **技术**：PostgreSQL、Go diff 库（sergi/go-diff）、版本号递增
- **产出**：`backend/internal/versioning/` 版本管理模块；管理后台版本历史页面

### 2.12 内容导出功能
- **任务**：支持多种格式导出文章内容：
  - `GET /api/v1/posts/:slug/export?format=markdown` — 导出原始 Markdown
  - `GET /api/v1/posts/:slug/export?format=pdf` — 导出 PDF（宇宙主题排版）
  - `GET /api/v1/posts/:slug/export?format=epub` — 导出 EPUB 电子书
  - `GET /api/v1/export/all?format=markdown` — 全站打包导出为 ZIP（Markdown + 元数据 YAML front matter）
  - 需管理员认证（API Key / JWT）
- **技术**：Go Markdown 解析、go-wkhtmltopdf（PDF）、go-epub（EPUB）、archive/zip
- **产出**：`backend/internal/export/` 导出模块；支持博客数据可移植性

### 2.13 内容统计 API
- **任务**：提供博客运营数据统计接口：
  - `GET /api/v1/stats/overview` — 总文章数、总评论数、总访问量、总订阅者数
  - `GET /api/v1/stats/popular` — 热门文章排行（按阅读量/评论数）
  - `GET /api/v1/stats/timeline` — 按日/周/月的发布数量和访问趋势
  - `POST /api/v1/stats/view/:slug` — 记录文章阅读（去重：同 IP + User-Agent 24 小时内不重复计数）
  - 阅读量去重采用**分级策略**（不使用 HyperLogLog——个人博客量级下 HLL 的 ~0.81% 误差反而比精确计数偏差更大，且无法查询特定访客是否已计数）：
    - 默认使用 **Redis SET** 精确去重：`SADD view:{slug}:{date} {ip_hash}`，TTL 24h 自动过期，`SCARD` 获取精确阅读数
    - 当单篇文章单日 SET 大小超过 10 万时，自动迁移到 **Redis Bloom Filter**（`BF.ADD` / `BF.EXISTS`，误判率 1%，内存仅 SET 的 1/8）
  - 定期持久化到 PostgreSQL
- **技术**：Redis SET + Redis Bloom Filter（Redis Stack）、PostgreSQL 聚合查询、Go 定时任务
- **产出**：`backend/internal/stats/` 统计模块；管理后台数据仪表盘数据源

### 2.14 文件/图片上传 API
- **任务**：实现文章配图和媒体文件的上传管理：
  - `POST /api/v1/upload` — 上传文件（需管理员认证），支持多文件批量上传
  - 文件类型白名单：图片（jpg/png/gif/webp/svg/avif）、文档附件（pdf，可选）
  - 上传流程：前端分片上传（>5MB 启用）→ 后端接收 → 生成唯一文件名（UUID + 原始扩展名）→ 图片自动压缩/生成缩略图（宽度 ≤ 1920px，质量 85%）→ 上传到对象存储（Cloudflare R2 / S3）→ 返回 CDN URL
  - `GET /api/v1/uploads` — 管理后台媒体库列表（分页、按类型筛选）
  - `DELETE /api/v1/uploads/:id` — 删除文件（同时删除对象存储中的文件）
  - 存储记录：`uploads` 表（id UUID, filename, mime_type, size, cdn_url, created_at）
  - Markdown 编辑器集成：粘贴/拖拽图片自动触发上传，返回 Markdown 图片语法插入
- **技术**：Go multipart 文件上传、imaging 库（图片压缩/缩略图）、AWS SDK / Cloudflare R2 SDK、分片上传（可选 tus 协议）
- **产出**：`backend/internal/upload/` 上传模块；`uploads` 表迁移文件；管理后台媒体库 API

---

## Phase 3: 数据库与缓存层

### 3.1 PostgreSQL Schema 设计与迁移
- **任务**：基于 ECS 设计模式创建核心表结构：
  - `celestial_bodies`（id UUID PK **[使用 UUIDv7 生成]**, type VARCHAR CHECK IN('PLANET','ASTEROID','PULSAR'), galaxy_id UUID FK, star_id UUID FK NULLABLE → galaxies(子分类), author_id UUID FK, title, slug VARCHAR UNIQUE, content TEXT, summary TEXT, physics_params JSONB, aesthetics_params JSONB, base_coordinates JSONB, embedding vector(768), tags TEXT[], locale VARCHAR DEFAULT 'zh', word_count INT, view_count INT, comment_count INT, status VARCHAR DEFAULT 'draft', created_at, updated_at, published_at, deleted_at NULLABLE）
    - **主键策略**：所有表的 UUID 主键统一使用 **UUIDv7**（RFC 9562）生成，而非 UUID v4。UUIDv7 前 48 位为毫秒时间戳 → B-Tree 索引写入近似顺序追加，零页分裂；按 ID 排序即按时间排序，部分场景可省去 `created_at` 索引。Go 实现：`github.com/google/uuid` 的 `uuid.NewV7()`
    - **类型枚举变更**：移除 `BLACKHOLE` 类型——黑洞不再是独立天体，而是每个星系中心的视觉元素。加密文章功能已废弃，`content_encrypted`、`encryption_salt`、`encryption_hint` 字段不再需要
    - **star_id 字段**：行星所属的恒星（子分类），FK 指向 `galaxies` 表中 `parent_id IS NOT NULL` 的记录。为 NULL 表示文章尚未归入子分类，围绕星系中心黑洞外围游离
  - `galaxies`（id UUID PK, parent_id UUID FK NULLABLE → galaxies(自引用), name, slug VARCHAR UNIQUE, description, color_scheme JSONB, position JSONB, sort_order INT, article_count INT DEFAULT 0, created_at, updated_at）
    - **层级设计**：`parent_id IS NULL` = 星系（主分类，中心有超大质量黑洞）；`parent_id IS NOT NULL` = 恒星（子分类，围绕父星系中心公转）
    - **article_count**：该分类下的文章总数（后端自动维护），决定恒星的生命周期阶段——< 10 原恒星盘、≥ 10 主序星、≥ 50 巨星、≥ 100 红巨星
  - `users`（id UUID PK, display_name, email, password_hash, avatar_seed, role, created_at）
  - `comments`（id UUID PK, body_id UUID FK → celestial_bodies, parent_comment_id UUID FK NULLABLE → comments, author_id, author_name VARCHAR, content, orbital_params JSONB, created_at, deleted_at NULLABLE）
  - `tags`（id UUID PK, name VARCHAR UNIQUE, slug VARCHAR UNIQUE, color VARCHAR, post_count INT DEFAULT 0）
  - `body_tags`（body_id UUID FK, tag_id UUID FK, PRIMARY KEY (body_id, tag_id)）— 文章-标签多对多关联
  - `article_versions`（id UUID PK, body_id UUID FK, content TEXT, physics_params JSONB, version_num INT, change_summary VARCHAR, created_at）
  - `subscribers`（id UUID PK, email VARCHAR UNIQUE, confirmed BOOLEAN, frequency VARCHAR, token VARCHAR, created_at）
  - `uploads`（id UUID PK, filename VARCHAR, mime_type VARCHAR, size BIGINT, cdn_url VARCHAR, created_at）
  - `reactions`（id UUID PK, target_type VARCHAR, target_id UUID, emoji VARCHAR, ip_hash VARCHAR, created_at, UNIQUE(target_type, target_id, emoji, ip_hash)）
  - `friend_links`（id UUID PK, name VARCHAR, url VARCHAR, description TEXT, icon_seed VARCHAR, sort_order INT, created_at）
  - `webhook_configs`（id UUID PK, url VARCHAR, events TEXT[], secret VARCHAR, active BOOLEAN, created_at）
  - 使用 migrate 工具管理 Schema 版本
  - **软删除**：`celestial_bodies` 和 `comments` 表使用 `deleted_at` 字段实现软删除——删除操作设置时间戳而非物理删除；所有查询默认过滤 `deleted_at IS NULL`；管理后台可查看回收站（30 天后定时任务彻底清除）
- **技术**：PostgreSQL 15+、golang-migrate、JSONB、TEXT[] 数组类型
- **产出**：`backend/migrations/` 目录下的 SQL 迁移文件，可重复执行

### 3.1.1 数据库索引策略
- **任务**：为核心查询路径设计索引，确保大数据量下的查询性能：
  - **B-Tree 索引**：
    - `celestial_bodies(slug)` — 文章 slug 查询（UNIQUE 自带）
    - `celestial_bodies(parent_id, type, status)` — 按星系查询已发布文章
    - `celestial_bodies(published_at DESC)` — 按发布时间倒排（首页/Feed）
    - `celestial_bodies(type, deleted_at)` — 按类型查询 + 软删除过滤
    - `comments(body_id, created_at)` — 按文章查询评论
    - `comments(parent_comment_id)` — 子评论查询
    - `tags(slug)` — 标签 slug 查询（UNIQUE 自带）
  - **GIN 索引**：
    - `celestial_bodies(physics_params)` — JSONB 物理参数内部字段查询
    - `celestial_bodies(tags)` — TEXT[] 数组包含查询（`@>` 操作符）
  - **全文检索索引**：
    - `celestial_bodies` 上创建 `tsvector` 生成列（`title || content`），建立 GIN 索引
    - 中文分词扩展配置（`zhparser` 或 `pg_jieba`）
  - **部分索引**：
    - `celestial_bodies(published_at) WHERE status = 'published' AND deleted_at IS NULL` — 只对已发布未删除的文章建索引，减小索引体积
  - 定期分析：配置 `autovacuum` 参数，确保统计信息及时更新
- **技术**：PostgreSQL B-Tree/GIN/Partial Index、`EXPLAIN ANALYZE` 查询分析
- **产出**：索引迁移文件；查询性能基准测试记录

### 3.1.2 数据库连接池配置
- **任务**：合理配置 PostgreSQL 连接池，确保高并发下的稳定性和资源利用率：
  - 使用 `pgxpool`（pgx v5 连接池）作为底层驱动
  - 连接池参数：
    - `MaxConns`: 25（根据服务器 CPU 核数 × 2 + 1 调整）
    - `MinConns`: 5（保持最少空闲连接，避免冷启动延迟）
    - `MaxConnLifetime`: 1h（防止连接老化）
    - `MaxConnIdleTime`: 30m（及时回收空闲连接）
    - `HealthCheckPeriod`: 1m（后台定期检查连接可用性）
  - 连接池监控：定期日志输出当前活跃/空闲/等待连接数，集成到 `/health/detail` 端点
  - Redis 连接池：`go-redis` 默认连接池，配置 `PoolSize: 20`、`MinIdleConns: 5`
- **技术**：pgxpool（pgx v5）、go-redis 连接池配置
- **产出**：`backend/internal/database/pool.go` 连接池初始化和监控代码

### 3.2 ORM / 数据访问层
- **任务**：使用 Ent（Go ORM）或 sqlc 定义实体 Schema 和查询；实现 Repository 层抽象（CelestialBodyRepo、GalaxyRepo、CommentRepo）
- **技术**：Ent 或 sqlc
- **产出**：`backend/internal/repository/` 数据访问层代码

### 3.3 Redis 缓存策略
- **任务**：实现星图拓扑缓存——首页加载时从 Redis 读取全宇宙天体坐标树（JSON 序列化），缓存 TTL 5 分钟；实现写穿透策略——文章/评论创建时主动失效相关缓存键
- **技术**：Redis 7+、go-redis/v9
- **产出**：`backend/internal/cache/` 缓存层代码，支持 Get/Set/Invalidate

### 3.4 物理参数计算服务
- **任务**：实现天体物理参数自动计算——新建文章时根据字数/标签自动生成 mass、orbit_radius、texture_seed 等参数；实现**分层轨道环带算法**为评论卫星分配轨道坐标，保证无穿模且视觉上形成行星环效果：
  - 不使用斐波那契球面分布（该算法将点均匀分布在球面上，视觉上像蜜蜂围球飞，而非优雅的轨道系统）
  - **分层轨道环带算法**：
    - 计算环带层数 = `ceil(n_satellites / SATELLITES_PER_RING)`（每环 8-12 颗）
    - 每层环带分配：`orbit_radius` 从洛希极限内边缘起递增 Δr（带 ±10% 随机抖动）；`orbit_inclination` 第一环 0°（赤道面），后续环交错倾斜 ±5°~15°
    - 环内卫星均匀分配相位角：`phase = 2π * i / n_in_ring + 随机抖动`
    - 当 n > 50 时：环间距收窄形成连续"行星环"，最外层切换为扁平粒子带
  - 行星轨道参数生成采用**简化开普勒模型**：根据 mass 和 orbit_radius 计算离心率 e（0.05~0.3）和轨道周期，大行星（长文）轨道半径大、速度慢（开普勒第三定律简化：`speed = K / sqrt(r³)`）
- **技术**：Go 数学库、分层轨道环带分配算法（自研）、开普勒轨道简化模型
- **产出**：`backend/internal/physics/` 物理计算模块

### 3.5 种子数据与数据导入
- **任务**：编写 seed 脚本，插入示例星系、示例文章（行星）、示例评论（卫星）数据；支持从 Markdown 文件批量导入文章
- **技术**：Go CLI 工具、Markdown 解析
- **产出**：`backend/cmd/seed/main.go`，可一键填充演示数据

---

## Phase 2-3 补充: 后端计算性能与前端分流

### 3.6 重计算 Web Worker 分流

- **任务**：将前端 CPU 密集型计算移入 Web Worker 线程，防止阻塞主线程导致 3D 渲染帧率下降：
  - **需要分流的计算**（按优先级排列）：
    | 计算任务 | 阻塞时长（估算） | 触发频率 | Worker 收益 |
    |----------|-----------------|----------|-------------|
    | 八叉树空间索引构建/更新 | 5-20ms | 场景初始化、天体增减时 | 高 |
    | Markdown 解析渲染（长文 > 10000 字） | 10-50ms | 每次打开文章 | 高 |
    | 搜索结果的 3D 坐标批量计算（质心、包围球） | 2-10ms | 每次搜索 | 中 |
    | 文章关联度计算（编辑距离 + 标签交集） | 5-30ms | 首次加载 | 中 |
    | 星座连线拓扑计算 | 3-15ms | 首次加载 | 中 |
  - **实现方式**：
    - 使用 [Comlink](https://github.com/GoogleChromeLabs/comlink) 简化 Worker 通信，将 Worker 函数像普通异步函数一样调用：
      ```tsx
      // worker.ts
      import { expose } from 'comlink'
      const api = {
        buildOctree(bodies: CelestialBody[]) { /* ... */ return octreeData },
        parseMarkdown(raw: string) { /* ... */ return html }
      }
      expose(api)

      // 主线程
      import { wrap } from 'comlink'
      const worker = wrap<typeof api>(new Worker('./worker.ts'))
      const octree = await worker.buildOctree(bodies)  // 不阻塞主线程
      ```
    - 数据传递使用 Transferable Objects（`ArrayBuffer`）避免大数据复制开销
    - Worker 数量限制：最多 2 个计算 Worker（避免移动端线程争抢）
  - **后备方案**：如果 Worker 不可用（极旧浏览器），回退到主线程 + `requestIdleCallback` 分帧执行
- **技术**：Web Workers、Comlink、Transferable Objects、requestIdleCallback
- **产出**：`workers/computeWorker.ts` 通用计算 Worker；`hooks/useWorker.ts` Worker 调用 Hook

### 3.7 后端批量查询与响应体积优化

- **任务**：优化后端 API 的响应效率，减少前端等待时间和带宽消耗：
  - **GraphQL 分层拉取策略**（与 §2.2 Schema 设计配合）：
    - 全景视图（远景）：仅拉取天体的 `id, type, position, mass, color_seed`（~50 bytes/天体），不拉取 `content, comments`
    - 星系视图（中景）：追加拉取行星的 `title, slug, comment_count, tags`（~200 bytes/天体）
    - 行星视图（近景）：才拉取 `content`（Markdown 全文）+ `comments`（含轨道参数）
    - 通过 GraphQL `@defer` 指令实现渐进式数据流——远景数据先返回渲染，近景数据后台继续加载
  - **响应压缩**：
    - 天体坐标精度裁剪：`float64` → `float32`（前端 3D 渲染不需要 15 位有效数字，6 位足够）
    - 轨道参数使用紧凑格式：`{ θ: 1.234, φ: 2.345, r: 50, i: 0.2 }` 而非冗长字段名
  - **游标分页（Cursor Pagination）**：评论列表使用游标分页（基于 `created_at` + `id`），替代 offset 分页，避免深分页性能退化
- **技术**：GraphQL @defer、gqlgen DataLoader、游标分页、JSON 压缩
- **产出**：GraphQL 分层查询策略文档；评论游标分页实现
