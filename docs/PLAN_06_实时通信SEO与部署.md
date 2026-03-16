# Phase 11-13: 实时通信、SEO 优化与部署运维

> 涵盖 WebSocket 实时互动、SEO/性能优化，以及生产部署与运维。

---

## Phase 11: 实时通信与多人在线

### 11.1 WebSocket 服务
- **任务**：在 Go 后端搭建 WebSocket 服务（gorilla/websocket 或 nhooyr/websocket）；实现房间机制——每个行星（文章页）为一个房间；维护在线用户列表
- **技术**：Go WebSocket 库、goroutine 并发管理
- **产出**：`backend/internal/ws/` WebSocket 服务模块

### 11.1.1 WebSocket 消息协议规范
- **任务**：定义清晰的 WebSocket 消息协议，规范前后端通信格式：
  - 消息格式（JSON）：
    ```
    {
      "type": "event_type",
      "room": "post:slug",
      "payload": { ... },
      "timestamp": 1710000000,
      "id": "msg_uuid"
    }
    ```
  - 客户端 → 服务端事件类型：
    - `join_room` — 加入行星/文章房间（payload: `{ slug }` ）
    - `leave_room` — 离开房间
    - `ping` — 心跳保活（每 30s 发送一次）
    - `cursor_move` — 光标/飞船位置同步（payload: `{ x, y, z }`，可选）
  - 服务端 → 客户端事件类型：
    - `pong` — 心跳响应
    - `room_state` — 加入房间后的初始状态（在线用户列表、近期未读事件）
    - `user_joined` / `user_left` — 用户进出通知
    - `satellite_launched` — 新评论卫星发射（payload: 完整卫星数据含 orbital_params）
    - `reaction_added` — 新增表情反应
    - `online_count` — 房间在线人数更新
    - `error` — 错误通知（payload: `{ code, message }`）
  - 错误码：`4001` 认证失败、`4002` 房间不存在、`4003` 频率超限、`4004` 消息格式错误
- **技术**：JSON 消息序列化、Go 枚举常量定义、TypeScript 类型定义（共享到 `shared/types/`）
- **产出**：`shared/types/ws.ts` 消息类型定义；`backend/internal/ws/protocol.go` 协议常量和解析器

### 11.1.2 多实例扩展与 Redis Pub/Sub
- **任务**：支持多个 Go 后端实例同时运行 WebSocket 服务时的跨节点消息广播：
  - 单实例容量预估：单个 Go 进程可承载约 10,000-50,000 并发 WebSocket 连接（取决于消息频率和服务器配置）
  - 跨节点广播：当部署多个后端实例时（Nginx 负载均衡），使用 Redis Pub/Sub 作为消息总线——实例 A 上的用户发表评论 → 实例 A 发布消息到 Redis Channel → 所有实例订阅该 Channel → 各实例向自己管理的连接广播
  - Channel 设计：`ws:room:{slug}` 按房间分 Channel，避免全局广播浪费
  - 在线用户计数：使用 Redis `SADD/SREM` 维护全局在线用户集合，跨实例准确计数
  - 降级方案：Redis 不可用时退化为单实例广播（仅当前实例内可见），日志告警
- **技术**：Redis Pub/Sub（go-redis）、Nginx sticky session（可选）、Go sync.Map（本地连接管理）
- **产出**：`backend/internal/ws/broker.go` Redis Pub/Sub 消息中间件；多实例部署配置

### 11.2 实时事件广播
- **任务**：实现核心实时事件：① 评论卫星发射事件——某用户发表评论时，同星区其他在线用户实时看到卫星升空动画 ② 用户在线光标/飞船位置同步（可选，轻量级）③ 在线人数显示
- **技术**：WebSocket 消息协议（JSON）、前端事件监听
- **产出**：多人可同时看到卫星发射的实时互动体验

### 11.3 前端 WebSocket 集成
- **任务**：创建 `useWebSocket` 自定义 Hook；连接管理（自动重连、心跳保活）；接收到卫星发射事件时触发发射动画（复用 Phase 6 的动画）；Zustand 维护在线用户列表
- **技术**：React Hook、WebSocket API、Zustand
- **产出**：`hooks/useWebSocket.ts`，前端实时通信集成

### 11.3.1 断线重连与事件补偿
- **任务**：确保 WebSocket 连接中断后不丢失重要事件：
  - 自动重连策略：断线后使用指数退避重连（1s → 2s → 4s → 8s → 最大 30s），最多重试 10 次后放弃并显示离线提示
  - 事件补偿：客户端记录最后收到的消息 `id`（`lastEventId`），重连成功后发送 `sync` 请求携带 `lastEventId`，服务端返回断线期间错过的事件列表
  - 服务端事件缓冲：每个房间在 Redis 中维护最近 100 条事件的有序集合（`ZADD`，按时间戳排序），支持按 `lastEventId` 查询后续事件
  - 离线状态 UI：连接断开时 HUD 右上角显示红色闪烁的"信号中断"指示器；重连中显示"重建连接..."；恢复后绿色闪烁 1 秒后消失
  - 补偿事件播放：重连后错过的卫星发射事件加速批量播放（动画时长缩短为正常的 1/3，间隔 0.2s），避免长时间断线后积压大量动画
- **技术**：指数退避算法、Redis ZRANGEBYSCORE、Zustand 连接状态管理
- **产出**：`hooks/useWebSocket.ts` 中的重连和补偿逻辑；`backend/internal/ws/buffer.go` 事件缓冲模块

### 11.4 在线用户 3D 可视化
- **任务**：将同一星区的在线用户渲染为 3D 场景中的可见实体：
  - 幽灵飞船：每个在线用户渲染为一个小型半透明飞船光点（`Sprite` + 发光材质，additive blending），颜色随机但同一用户保持一致（基于 session hash）
  - 位置同步（轻量级）：每 2 秒同步一次用户摄像机的粗略位置（四舍五入到整数坐标，减少消息频率），其他用户看到的飞船位置平滑插值
  - 悬停显示：鼠标悬停飞船光点时显示用户昵称 tooltip（匿名用户显示"探索者 #xxx"）
  - 聚集效果：同一行星附近有多个用户时，飞船光点形成小型编队效果
  - 性能保护：在线用户 > 30 时停止显示个体飞船，切换为行星旁的聚合人数气泡（"12 人正在探索"）
  - 隐私模式（可选）：用户可选择"隐身探索"，不向其他人广播位置
- **技术**：Three.js Sprite、WebSocket 位置同步、GSAP 插值平滑、InstancedMesh（多用户时）
- **产出**：`components/canvas/OnlineUsers.tsx` 在线用户可视化组件；`components/ui/OnlineIndicator.tsx` 在线人数指示器

### 11.5 在线用户位置同步的 Lerp 平滑与节流

- **任务**：实现网络延迟下在线用户飞船位置的平滑显示，解决位置跳变和高频消息两大问题：
  - **客户端采样节流**：
    - 本地摄像机位置以 60fps 更新，但 WebSocket 上报频率限制为 **每 500ms 一次**（遵循 Phase 1 §1.21 节流策略）
    - 上报时对坐标四舍五入到整数（`Math.round`），减少消息体积
    - 位置变化 < 5 单位时跳过本次上报（避免静止时的无效消息）
  - **接收端平滑插值**：
    - 收到其他用户的位置更新后，不直接设置飞船位置，而是设置为**目标位置**
    - `useFrame` 中使用帧率无关 Lerp（Phase 4 §4.14）逐帧逼近目标：
      ```tsx
      useFrame((_, delta) => {
        const t = 1 - Math.exp(-SMOOTH_SPEED * delta)
        ghostShip.position.lerp(targetPosition, t)
      })
      ```
    - 效果：即使网络延迟 200ms，飞船在屏幕上仍然平滑移动（线性外推 + 阻尼回归）
  - **消息丢失容错**：如果超过 3 秒未收到某用户的位置更新，开始渐隐飞船（opacity Lerp → 0）；超过 10 秒视为离线，移除飞船

- **技术**：Lerp 帧率无关插值、WebSocket 消息节流、线性外推预测
- **产出**：`hooks/useGhostShipInterpolation.ts` 飞船位置插值 Hook

---

## Phase 12: SEO 与性能优化

### 12.1 SSR/SSG 文章页面
- **任务**：每篇文章的 URL（`/post/[slug]`）使用 Next.js SSG（`generateStaticParams`）预生成静态 HTML；HTML 中包含完整的文章内容（标题、正文、元信息）；3D 场景作为客户端增强层 hydrate 上去
- **技术**：Next.js SSG、generateStaticParams、generateMetadata
- **产出**：搜索引擎可完整抓取的文章页面

### 12.2 结构化数据与 Meta 标签
- **任务**：为每个页面生成 Open Graph、Twitter Card meta 标签；文章页添加 `Article` JSON-LD 结构化数据；首页添加 `WebSite` JSON-LD；生成 `sitemap.xml` 和 `robots.txt`
- **技术**：Next.js Metadata API、JSON-LD、next-sitemap
- **产出**：完善的 SEO 元数据，搜索引擎友好

### 12.3 3D 资源优化
- **任务**：实现纹理压缩——将 PNG 贴图转为 KTX2/Basis 格式（Drei `<KTX2Loader>`）；GLTF 模型使用 Draco 压缩；实现渐进式加载——先加载低分辨率贴图，后台异步替换高清版
- **技术**：KTX2、Basis Universal、Draco、Three.js Loader
- **产出**：3D 资源体积减少 60-80%，首屏加载加速

### 12.4 渲染性能优化
- **任务**：实现视锥剔除——不在摄像机视野内的天体不渲染（R3F 默认支持，确保 boundingSphere 正确）；实现 LOD 分级——远距离天体降低几何精度和材质复杂度；帧率监控（Stats.js）并设定性能预算（目标 60fps）
- **技术**：Three.js Frustum Culling、LOD、Stats.js
- **产出**：大规模场景下稳定 60fps 的性能表现

### 12.5 代码分割与懒加载
- **任务**：3D 场景组件使用 `next/dynamic` 动态导入（禁用 SSR）；按路由分割代码包；Shader 文件按需加载；字体和非关键 CSS 延迟加载
- **技术**：Next.js dynamic import、React.lazy、Webpack chunk splitting
- **产出**：首屏 JS Bundle < 200KB（gzip），3D 引擎异步加载

### 12.6 Core Web Vitals 优化目标
- **任务**：为 3D 重型站点制定明确的性能指标目标和优化策略：
  - 目标值（移动端）：
    - **LCP（最大内容绘制）< 2.5s**：SEO 暗物质层的文章 HTML 作为 LCP 元素，3D Canvas 异步加载不阻塞 LCP
    - **FID/INP（交互延迟）< 200ms**：3D 初始化放在 `requestIdleCallback` 中，不阻塞主线程；重 Shader 编译使用 Web Worker（可选）
    - **CLS（布局偏移）< 0.1**：Canvas 容器预设固定尺寸（100vw × 100vh），避免加载时布局跳动；字体使用 `font-display: swap` + `size-adjust`
  - 监控手段：
    - CI 中集成 Lighthouse（GitHub Actions），PR 自动跑分，分数低于阈值阻止合并
    - 生产环境使用 `web-vitals` 库采集真实用户数据（RUM），上报到统计 API
    - 管理后台展示 Web Vitals 趋势图表
  - 性能预算（Performance Budget）：
    - 首屏 HTML < 50KB（gzip）
    - 首屏 JS < 200KB（gzip，不含 3D 引擎）
    - 3D 引擎 chunk < 500KB（gzip，异步加载）
    - 字体文件总计 < 150KB（woff2）
- **技术**：Lighthouse CI、web-vitals 库、Next.js `next/font`、`font-display: swap`
- **产出**：`.github/workflows/lighthouse.yml` Lighthouse CI 配置；`utils/webVitals.ts` 性能采集上报；性能预算文档

### 12.7 文章图片优化
- **任务**：对文章内嵌图片进行自动化优化：
  - 使用 `next/image` 组件替代原生 `<img>`——自定义 react-markdown 的 `img` 渲染器，自动转为 `<Image>` 组件
  - 响应式尺寸：`srcSet` 自动生成多尺寸变体（640/750/1080/1920w），浏览器按屏幕宽度选择最优尺寸
  - 格式优化：自动转换为 WebP/AVIF（Next.js Image Optimization 或 CDN 端转换）
  - 懒加载：首屏外图片使用 `loading="lazy"`，进入视口前显示低质量模糊占位图（LQIP，blurhash）
  - CDN 集成：`next/image` 的 `loader` 配置为 CDN 域名，图片请求走 CDN 缓存
  - 占位宽高：Markdown 图片解析时提取原始宽高（上传时记录），设置 `width` / `height` 避免 CLS
- **技术**：next/image、自定义 react-markdown 渲染器、blurhash（LQIP）、CDN Image Optimization
- **产出**：`components/ui/markdown/MarkdownImage.tsx` 优化图片组件；图片加载的零 CLS 方案

### 12.8 字体加载策略
- **任务**：优化 Web 字体加载，避免渲染阻塞和布局偏移：
  - 使用 `next/font` 内置字体加载器（自托管字体，消除 Google Fonts 外部请求）：
    - `Inter`（正文）：`next/font/google` 自动子集化 + 自托管
    - `JetBrains Mono`（代码/HUD）：`next/font/google` 或本地 woff2 文件
    - `Space Grotesk`（标题，可选）：本地 woff2
  - `font-display: swap`：字体未加载完成时使用系统后备字体，避免 FOIT（不可见文本闪烁）
  - `size-adjust` / `ascent-override`：微调后备字体度量值，减小字体切换时的 CLS
  - 预加载关键字体：首屏使用的字体文件通过 `<link rel="preload">` 提前加载
  - 字体子集化：仅包含实际使用的字符集（中文场景可按常用 6000 字子集化，减小文件体积）
- **技术**：next/font、woff2 格式、font-display、CSS size-adjust
- **产出**：`app/layout.tsx` 字体配置；优化后的字体文件（总计 < 150KB woff2）

### 12.9 Bundle 体积监控
- **任务**：在 CI 中持续监控前端打包体积，防止随开发逐步膨胀：
  - GitHub Actions 中每次 PR 运行 `next build`，使用 `@next/bundle-analyzer` 生成 Bundle 分析报告
  - 体积对比：与 `main` 分支的 Bundle 体积对比，超过阈值（任意 chunk 增长 > 10KB）在 PR 中自动评论警告
  - 可视化：Bundle 分析报告上传为 PR Artifact，可在线查看 Treemap 图（哪些模块占用最大）
  - 预警规则：总 JS 体积（gzip）超过 1MB 时 CI 失败阻止合并
  - 定期清理：每月审查 `node_modules` 依赖，移除未使用的包（`depcheck`）
- **技术**：@next/bundle-analyzer、GitHub Actions、`size-limit`（可选）、depcheck
- **产出**：`.github/workflows/bundle-check.yml` 体积检查 CI；Bundle 体积趋势记录

### 12.10 帧预算管理与运行时性能监控

- **任务**：建立帧预算分配机制和运行时性能剖析能力，确保 60fps 目标可量化追踪：
  - **帧预算分配**（目标: 16.67ms/帧）：
    | 阶段 | 预算 | 说明 |
    |------|------|------|
    | 物理/动画更新（useFrame） | ≤ 3ms | 轨道公转、自转、粒子移动、Lerp 插值 |
    | 射线检测（Raycaster） | ≤ 1ms | 已通过 BVH 加速（PLAN_03 §4.11） |
    | React 协调（reconciliation） | ≤ 2ms | 已通过 re-render 防护（Phase 1 §1.17）控制 |
    | GPU 渲染（Draw Calls + Shader） | ≤ 10ms | LOD + InstancedMesh + Geometry Merge 控制 |
    | 余量 | ~1ms | 浏览器合成、垃圾回收等不可控开销 |
  - **超预算检测**：
    ```tsx
    useFrame(() => {
      const frameStart = performance.now()
      // ... 所有逻辑 ...
      const frameDuration = performance.now() - frameStart
      if (frameDuration > 12) {
        // 超过 12ms 的帧（留 4.67ms 给 GPU）标记为"重帧"
        console.warn(`Heavy frame: ${frameDuration.toFixed(1)}ms`)
        // 自动降级: 临时减少粒子数 / 跳过非关键动画更新
      }
    })
    ```
  - **开发环境性能面板**：
    - 集成 [Stats.js](https://github.com/mrdoob/stats.js) 显示实时 FPS / MS / MB
    - 集成 [r3f-perf](https://github.com/utsuboco/r3f-perf)（R3F 专用）显示 Draw Calls、Triangles、Shader Programs、Textures 数量
    - 通过 URL 参数 `?debug=perf` 或键盘快捷键 `` ` ``（反引号）切换显示
    - 生产环境移除（通过 `next/dynamic` + `process.env.NODE_ENV` 条件加载）
  - **生产环境性能采样上报**：
    - 随机 5% 的用户会话采集 `useFrame` 帧耗时分布（P50 / P95 / P99）
    - 每 30 秒聚合一次上报到统计 API（`POST /api/v1/stats/perf`）
    - 管理后台展示各画质等级下的帧率分布图表，辅助判断是否需要调整自适应策略
- **技术**：performance.now()、Stats.js、r3f-perf、条件加载、统计 API
- **产出**：`hooks/useFrameBudget.ts` 帧预算监控 Hook；`components/debug/PerfOverlay.tsx` 开发调试性能面板

### 12.11 GPU 显存泄漏检测与告警

- **任务**：在开发和 Staging 环境中建立 GPU 显存泄漏的自动检测机制：
  - **检测方式**：
    - 每 10 秒采样一次 `renderer.info.memory`（geometries、textures 数量）和 `renderer.info.programs`（Shader program 数量）
    - 如果在 60 秒内以下指标**持续单调递增**，触发告警：
      - Geometries 数量增长 > 20
      - Textures 数量增长 > 10
      - Programs 数量增长 > 5
    - 告警方式：控制台输出红色警告 + 性能面板闪烁提示 `⚠ GPU MEMORY LEAK DETECTED`
  - **典型泄漏场景与防护清单**：
    | 场景 | 泄漏原因 | 防护措施 |
    |------|----------|----------|
    | 虫洞跃迁来回 | 旧星区纹理未 dispose | Phase 8 §8.7 场景切换管理 |
    | 反复打开/关闭文章 | 文章配图 Texture 未 dispose | ArticleReader 卸载时清理 |
    | LOD 切换 | 高精度 Geometry/Material 替换后未释放 | LOD 组件统一管理 dispose |
    | 搜索反复触发 | 高亮 Material clone 后未回收 | 使用 Material uniform 切换而非 clone |
    | 编辑器图片预览 | useTexture 加载后未释放 | useEffect cleanup |
  - **CI 集成（可选）**：E2E 测试中模拟"浏览 10 篇文章 → 跃迁 3 个虫洞 → 搜索 5 次"操作流程，对比首末 `renderer.info` 差值，超过阈值则测试失败
- **技术**：`renderer.info.memory`、定时采样、阈值检测、E2E 测试（Playwright）
- **产出**：`hooks/useGPULeakDetector.ts` 泄漏检测 Hook；开发环境自动告警；E2E 显存回归测试

---

## Phase 13: 部署与运维

### 13.1 生产环境 Docker 镜像
- **任务**：编写多阶段 Dockerfile：前端（Node.js build → Nginx 静态服务 或 Node.js standalone）；后端（Go build → scratch/alpine 最小镜像）；镜像体积优化（前端 < 100MB，后端 < 30MB）
- **技术**：Docker 多阶段构建、Alpine Linux
- **产出**：`frontend/Dockerfile`、`backend/Dockerfile`，生产就绪的容器镜像

### 13.2 Docker Compose 生产编排
- **任务**：编写 `docker-compose.prod.yml`，包含：Nginx（反向代理 + HTTPS 终结）、Next.js 服务、Go API 服务、PostgreSQL（带数据卷持久化）、Redis（带数据卷）；配置健康检查和重启策略
- **技术**：Docker Compose、Nginx
- **产出**：`docker-compose.prod.yml`，一键部署全栈服务

### 13.3 Nginx 反向代理配置
- **任务**：配置 Nginx：① `/` → Next.js 前端 ② `/graphql` → Go 后端 ③ `/ws` → WebSocket 后端（upgrade 头处理）④ 静态资源缓存头（贴图/模型文件 Cache-Control: max-age=31536000）⑤ Gzip/Brotli 压缩 ⑥ HTTPS 证书自动化（Let's Encrypt + certbot）
- **技术**：Nginx、Let's Encrypt、Certbot
- **产出**：`nginx/nginx.conf`，生产级反向代理配置

### 13.4 对象存储与 CDN 配置
- **任务**：将宇宙背景图、行星法线贴图、GLTF 模型等大文件上传至 Cloudflare R2（或 AWS S3）；配置 CDN 域名和缓存规则；前端代码中所有静态资源 URL 指向 CDN
- **技术**：Cloudflare R2 / AWS S3、CDN 配置
- **产出**：3D 资源全球 CDN 加速，秒开体验

### 13.5 监控与日志
- **任务**：后端结构化日志输出（Go slog，JSON 格式）；前端错误追踪（Sentry）；应用性能监控（可选：Prometheus + Grafana 或云厂商 APM）；WebGL 渲染性能上报（FPS、Draw Call 数）
- **技术**：Go slog、Sentry、Prometheus（可选）
- **产出**：可观测的生产环境，异常可追踪

### 13.6 备份与灾备
- **任务**：PostgreSQL 定时备份（pg_dump cron 任务，每日全量 + WAL 增量）；Redis RDB 快照持久化；备份文件上传至对象存储异地保存；编写恢复脚本并定期验证
- **技术**：pg_dump、Redis RDB/AOF、Cron、Shell Script
- **产出**：`scripts/backup.sh`、`scripts/restore.sh`，完善的数据备份策略

### 13.7 预发布 Staging 环境
- **任务**：搭建与生产环境隔离的 Staging 环境，用于部署前验证：
  - 独立的 `docker-compose.staging.yml`，使用独立的数据库和 Redis 实例（不共享生产数据）
  - Staging 域名：`staging.yourdomain.com`，HTTPS 证书独立签发
  - 数据：定期从生产环境同步脱敏数据（移除真实邮箱、IP 等敏感信息），或使用 seed 数据
  - CI/CD 集成：`develop` 分支合并后自动部署到 Staging；`main` 分支合并后自动部署到 Production
  - Staging 标识：页面右下角显示"STAGING"水印 + 当前 Git commit hash，防止与生产混淆
  - 访问控制：Staging 环境通过 HTTP Basic Auth 或 IP 白名单限制访问
- **技术**：Docker Compose、GitHub Actions 自动部署、Nginx Basic Auth
- **产出**：`docker-compose.staging.yml`；CI/CD 自动部署流水线；Staging 环境访问控制

### 13.8 零停机部署
- **任务**：实现生产环境更新时的零停机部署：
  - 滚动更新策略：
    - ① 构建新版本 Docker 镜像并推送到 Registry
    - ② `docker compose up -d --no-deps --build <service>` 逐个服务更新
    - ③ Nginx 健康检查（`/health`）检测到新容器就绪后，自动切换流量
    - ④ 旧容器等待已有请求处理完成后退出（复用优雅关停逻辑）
  - 数据库迁移安全：
    - 迁移脚本必须向后兼容（新代码能跑旧 Schema，旧代码能跑新 Schema）
    - 部署顺序：先跑迁移 → 部署新后端 → 部署新前端
    - 危险迁移（删列、改类型）拆分为多次部署逐步完成
  - 回滚方案：保留上一版本的 Docker 镜像 tag，一键 `docker compose up -d --no-deps <service>:prev-tag` 回滚
  - 部署脚本：`scripts/deploy.sh` 封装完整部署流程，支持 `--rollback` 参数
- **技术**：Docker Compose 滚动更新、Nginx upstream 健康检查、golang-migrate 向后兼容迁移
- **产出**：`scripts/deploy.sh` 部署脚本；`scripts/rollback.sh` 回滚脚本；部署 SOP 文档

### 13.9 安全加固
- **任务**：对生产环境进行全面的安全加固：
  - HTTP 安全头（Nginx 配置）：
    - `Strict-Transport-Security: max-age=31536000; includeSubDomains` — 强制 HTTPS
    - `Content-Security-Policy` — 限制脚本/样式/图片来源（允许 self + CDN 域名 + 内联 unsafe-inline 用于 3D 场景）
    - `X-Frame-Options: DENY` — 防止被 iframe 嵌套
    - `X-Content-Type-Options: nosniff` — 禁止 MIME 嗅探
    - `Referrer-Policy: strict-origin-when-cross-origin` — 控制 Referer 泄露
    - `Permissions-Policy` — 禁用不需要的浏览器特性（geolocation、microphone 等）
  - 依赖安全：
    - CI 中集成 `npm audit`（前端）和 `govulncheck`（Go 后端），发现高危漏洞阻止合并
    - Dependabot / Renovate 自动提 PR 更新有漏洞的依赖
  - Nginx 层防护：
    - 限制请求体大小（`client_max_body_size 15m`）
    - 全局速率限制（`limit_req_zone`，每 IP 100 req/min）
    - 隐藏服务器版本号（`server_tokens off`）
  - Docker 安全：
    - 容器以非 root 用户运行
    - 只读文件系统（`read_only: true`） + 必要的可写目录挂载
    - 无特权模式（`privileged: false`）
- **技术**：Nginx 安全头配置、npm audit、govulncheck、Dependabot、Docker 安全最佳实践
- **产出**：`nginx/security-headers.conf` 安全头配置（include 引入）；CI 安全扫描步骤；Docker 安全加固配置

### 13.10 域名与 DNS 规划
- **任务**：规划博客的域名结构和 DNS 配置：
  - 域名结构：
    - `yourdomain.com` — 主站（Next.js 前端）
    - `api.yourdomain.com` — Go 后端 API（GraphQL + REST + WebSocket）
    - `cdn.yourdomain.com` — 静态资源 CDN（指向 Cloudflare R2 / S3）
    - `admin.yourdomain.com`（可选）— 管理后台独立域名，或使用 `yourdomain.com/admin` 路由
    - `staging.yourdomain.com` — Staging 环境
  - DNS 配置：
    - 主站和 API：A 记录指向服务器 IP（或 CNAME 指向负载均衡器）
    - CDN：CNAME 指向 Cloudflare R2 自定义域名
    - 邮件相关：MX 记录 + SPF + DKIM + DMARC（用于 Newsletter 邮件发送，提高送达率）
  - SSL 证书：Let's Encrypt 通配符证书（`*.yourdomain.com`），通过 DNS-01 challenge 验证
  - Cloudflare 代理（可选）：主站和 API 通过 Cloudflare 代理，获取 DDoS 防护和额外缓存层
- **技术**：DNS 管理、Let's Encrypt 通配符证书、SPF/DKIM/DMARC 邮件认证
- **产出**：DNS 记录配置清单；SSL 证书自动续签脚本；邮件认证 DNS 配置

### 13.11 访客分析面板（自托管）
- **任务**：部署自托管的隐私友好型访客分析服务，替代第三方统计：
  - 集成 Umami 或 Plausible（开源、轻量、GDPR 合规）
  - 追踪指标：页面浏览量（PV）、独立访客（UV）、来源渠道、设备类型、停留时长
  - 管理后台嵌入分析仪表盘（iframe 或 API 拉取数据渲染自定义图表）
  - 前端埋点脚本 < 1KB，不影响页面性能
  - 3D 场景特有埋点：天体点击热力图、平均停留星区、最受欢迎行星排行
- **技术**：Umami / Plausible（Docker 部署）、自定义事件埋点、管理后台集成
- **产出**：`docker-compose.prod.yml` 中增加分析服务；管理后台分析数据页面

### 13.12 i18n 多语言支持
- **任务**：为博客添加多语言支持：
  - 前端 UI 文案国际化——使用 `next-intl` 或 `react-i18next`，支持中文（默认）、English、日本語等
  - 文章内容多语言——同一篇文章支持多个语言版本（`celestial_bodies` 增加 `locale` 字段），不同语言版本共享同一行星但显示不同内容
  - URL 策略：`/zh/post/slug`、`/en/post/slug`，带 `hreflang` 标签
  - 3D 场景语言联动（可选）：不同语言的星区使用不同色调滤镜，营造文化差异感
  - 语言切换器：HUD 面板中的星球图标，点击切换语言
- **技术**：next-intl / react-i18next、Next.js i18n 路由、`hreflang` SEO 标签
- **产出**：`locales/` 翻译文件目录；多语言路由配置；语言切换 UI 组件

### 13.13 管理后台 Dashboard
- **任务**：构建功能完整的可视化管理后台：
  - 仪表盘首页：文章/评论/访客数量卡片、近期趋势图表、热门文章排行、系统状态（CPU/内存/磁盘）
  - 文章管理：列表/搜索/筛选、Markdown 编辑器（集成 Monaco Editor 或 Milkdown）、实时预览、发布/草稿/归档状态切换
  - 评论管理：评论列表、批量审核/删除、垃圾评论过滤记录
  - 星系管理：创建/编辑星系、配置颜色方案、调整 3D 位置参数
  - 系统设置：站点信息、Webhook 配置、友链管理、订阅者列表、API Key 管理
  - 管理后台独立路由 `/admin`，仅认证博主可访问
- **技术**：Next.js 路由分组、React 图表库（Recharts）、Monaco Editor、Tailwind CSS 管理面板布局
- **产出**：`app/admin/` 管理后台页面目录；完整的博客运营管理界面

### 13.14 自动备份到 Git
- **任务**：文章内容定时同步到 Git 仓库，形成双重备份和版本追踪：
  - Cron 定时任务（每日凌晨）：导出全部文章为 Markdown 文件（含 YAML front matter 元数据）
  - 目录结构按星系分组：`content/galaxy-slug/post-slug.md`
  - 自动 `git add` + `git commit`（commit message 含时间戳和变更摘要）+ `git push` 到远程仓库
  - 支持手动触发即时同步（管理后台按钮 或 API 端点）
  - 反向支持：从 Git 仓库的 Markdown 文件导入/同步文章到数据库
- **技术**：Go os/exec（git 命令）、Cron 定时任务、Markdown + YAML front matter 序列化
- **产出**：`backend/cmd/git-sync/main.go`，Git 同步工具；`scripts/git-backup.sh` 备份脚本

---

## 附录：技术栈总览

| 层级 | 技术选型 |
|------|----------|
| **前端框架** | Next.js 14+ (App Router, TypeScript) |
| **3D 引擎** | Three.js + React Three Fiber + Drei |
| **动画** | GSAP (GreenSock) |
| **状态管理** | Zustand |
| **样式** | Tailwind CSS + CSS 自定义属性 |
| **Markdown 渲染** | react-markdown + remark-gfm + rehype-highlight + remark-math + rehype-katex |
| **图表/可视化** | Mermaid（流程图）、Recharts（管理后台）、SVG 雷达图 |
| **代码沙盒** | Sandpack (@codesandbox/sandpack-react) |
| **代码编辑器** | Monaco Editor（管理后台 Markdown 编辑器） |
| **字体** | Inter + JetBrains Mono + Space Grotesk (next/font 自托管) |
| **PWA** | next-pwa / Workbox |
| **国际化** | next-intl / react-i18next |
| **性能监控** | web-vitals + Lighthouse CI + @next/bundle-analyzer |
| **后端语言** | Go 1.22+ (Golang) |
| **Web 框架** | Fiber v2 (或 Gin) |
| **API (GraphQL)** | gqlgen + dataloaden |
| **API (REST)** | Fiber/Gin RESTful 路由 + swaggo (Swagger) |
| **认证** | JWT (golang-jwt) + Argon2id + API Key |
| **配置管理** | Viper |
| **输入校验** | go-playground/validator + bluemonday (HTML 净化) |
| **数据库** | PostgreSQL 15+ (JSONB, tsvector 全文检索) |
| **ORM** | Ent 或 sqlc |
| **数据库迁移** | golang-migrate |
| **缓存** | Redis 7+ (go-redis/v9) |
| **搜索引擎** | PostgreSQL tsvector / Meilisearch (可选) |
| **实时通信** | WebSocket (gorilla/websocket) + Redis Pub/Sub |
| **邮件** | Go gomail / SMTP |
| **文件存储** | Cloudflare R2 / AWS S3 |
| **加密** | AES-256-GCM (Go crypto/aes + Web Crypto API) |
| **GeoIP** | MaxMind GeoLite2 |
| **容器化** | Docker + Docker Compose (多阶段构建) |
| **反向代理** | Nginx (Gzip/Brotli + HTTPS + 安全头) |
| **SSL 证书** | Let's Encrypt + Certbot (通配符证书) |
| **CDN** | Cloudflare (代理 + DDoS 防护) |
| **访客分析** | Umami / Plausible (自托管) |
| **错误追踪** | Sentry |
| **监控** | Prometheus + Grafana (可选) |
| **CI/CD** | GitHub Actions (lint + build + test + Lighthouse + bundle check + 自动部署) |
| **安全扫描** | npm audit + govulncheck + Dependabot |

---

## 附录：ECS 数据模型映射

| 博客概念 | 天体映射 | 数据库标记 | 层级关系 |
|----------|----------|-----------|----------|
| **主分类/大类** | **星系 Galaxy** + 中心超大质量黑洞 | `galaxies` 表 (`parent_id IS NULL`) | 宇宙的顶级结构 |
| **子分类** | **恒星 Star** | `galaxies` 表 (`parent_id IS NOT NULL`) | 围绕星系中心黑洞运行 |
| 已发布文章 | 行星 Planet | `celestial_bodies.type = 'PLANET'` | 围绕所属恒星（子分类）公转 |
| 留言/评论 | 卫星 Satellite | `comments` 表 + `orbital_params` | 围绕行星公转 |
| 灵感/草稿 | 小行星 Asteroid | `celestial_bodies.type = 'ASTEROID'` | 星系边缘小行星带 |
| 时间轴归档 | 虫洞 Wormhole | 虚拟实体，按年份聚合查询生成 | 独立空间 |
| 个人简介 | 脉冲星 Pulsar | `celestial_bodies.type = 'PULSAR'` | 宇宙中心 |

> **恒星生命周期**：子分类文章数 < 10 → 原恒星盘（暗淡星云态）；≥ 10 → 主序星（明亮）；≥ 50 → 巨星；≥ 100 → 红巨星。
> **黑洞角色变更**：黑洞不再映射加密文章，而是每个星系中心的超大质量黑洞（引力锚点 + 分类概览入口）。`BLACKHOLE` 从 `celestial_bodies.type` 枚举中移除。
