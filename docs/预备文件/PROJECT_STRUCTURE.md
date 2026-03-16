# CyberGeek 宇宙博客 — 项目目录结构

> Monorepo 架构，pnpm workspaces 管理
> 每个文件标注 `— 职责说明` 和 `(Phase X.Y)` 开发阶段

---

## 根目录

```
cybergeek-blog/
├── pnpm-workspace.yaml                — pnpm workspaces 配置 (Phase 1.0)
├── package.json                       — 根 package.json，定义 workspace 脚本 (Phase 1.0)
├── pnpm-lock.yaml                     — 依赖锁定文件 (Phase 1.0)
├── turbo.json                         — Turborepo 流水线配置（可选） (Phase 1.0)
├── .gitignore                         — Git 忽略规则 (Phase 1.0)
├── .env.example                       — 环境变量模板 (Phase 1.0)
├── docker-compose.yml                 — 本地开发环境编排（PostgreSQL + Redis + App） (Phase 1.0)
├── docker-compose.prod.yml            — 生产环境编排 (Phase 5.0)
├── Makefile                           — 常用命令快捷入口 (Phase 1.0)
├── LICENSE                            — 开源协议 (Phase 1.0)
│
├── frontend/                          — Next.js 前端应用
├── backend/                           — Go 后端服务
├── shared/                            — 共享 TypeScript 类型（@cybergeek/shared）
├── nginx/                             — Nginx 反向代理配置
├── scripts/                           — 运维与部署脚本
├── docs/                              — 项目规范文档
└── .github/                           — GitHub Actions CI/CD
```

---

## frontend/ — Next.js 应用

```
frontend/
├── package.json                       — 前端依赖与脚本 (Phase 1.0)
├── tsconfig.json                      — TypeScript 配置 (Phase 1.0)
├── next.config.ts                     — Next.js 配置（Turbopack、i18n、PWA） (Phase 1.0)
├── tailwind.config.ts                 — Tailwind CSS 主题配置（宇宙色板） (Phase 1.0)
├── postcss.config.mjs                 — PostCSS 插件配置 (Phase 1.0)
├── next-env.d.ts                      — Next.js 类型声明 (Phase 1.0)
├── .env.local.example                 — 前端环境变量模板 (Phase 1.0)
├── codegen.ts                         — GraphQL Code Generator 配置 (Phase 2.0)
│
├── public/                            — 静态资源
│   ├── favicon.ico                    — 站点图标 (Phase 1.0)
│   ├── manifest.json                  — PWA 清单 (Phase 4.5)
│   ├── sw.js                          — Service Worker（next-pwa 生成） (Phase 4.5)
│   ├── robots.txt                     — 搜索引擎爬虫规则 (Phase 4.5)
│   ├── sitemap.xml                    — 站点地图（动态生成） (Phase 4.5)
│   ├── og-default.png                 — 默认 Open Graph 图片 (Phase 4.5)
│   ├── textures/                      — 3D 纹理贴图
│   │   ├── planet-diffuse.webp        — 星球漫反射贴图 (Phase 1.2)
│   │   ├── planet-normal.webp         — 星球法线贴图 (Phase 1.2)
│   │   ├── planet-roughness.webp      — 星球粗糙度贴图 (Phase 1.2)
│   │   ├── atmosphere-gradient.webp   — 大气层渐变贴图 (Phase 1.2)
│   │   ├── starfield.webp             — 星空背景贴图 (Phase 1.1)
│   │   ├── nebula-cloud.webp          — 星云粒子贴图 (Phase 3.2)
│   │   ├── asteroid.webp              — 小行星贴图 (Phase 2.3)
│   │   ├── ring-particle.webp         — 环带粒子贴图 (Phase 2.3)
│   │   ├── wormhole-distortion.webp   — 虫洞扭曲贴图 (Phase 2.1)
│   │   └── noise.webp                 — 通用噪声纹理 (Phase 1.1)
│   ├── models/                        — 3D 模型文件
│   │   └── satellite.glb              — 卫星模型 (Phase 2.2)
│   └── fonts/                         — 自托管字体
│       └── LXGWWenKai-Regular.woff2   — 霞鹜文楷字体文件 (Phase 1.0)
│
├── assets/
│   └── audio/                         — 音效资源
│       ├── ambient-space.mp3          — 太空环境音 (Phase 3.4)
│       ├── whoosh.mp3                 — 星球切换音效 (Phase 3.4)
│       ├── click.mp3                  — 点击反馈音效 (Phase 3.4)
│       ├── wormhole-enter.mp3         — 进入虫洞音效 (Phase 3.4)
│       └── notification.mp3           — 通知提示音 (Phase 3.4)
│
├── app/                               — App Router 页面
│   ├── layout.tsx                     — 根布局（字体、主题、Provider 注入） (Phase 1.0)
│   ├── page.tsx                       — 首页（宇宙场景 + 星球列表） (Phase 1.1)
│   ├── loading.tsx                    — 全局 Loading 状态 (Phase 1.1)
│   ├── not-found.tsx                  — 404 页面（信号丢失主题） (Phase 1.3)
│   ├── error.tsx                      — 全局错误边界 (Phase 1.3)
│   ├── globals.css                    — 全局样式入口 (Phase 1.0)
│   ├── providers.tsx                  — 客户端 Provider 组合（Apollo、Zustand、Theme） (Phase 1.0)
│   │
│   ├── (blog)/                        — 博客前台路由组
│   │   ├── layout.tsx                 — 博客布局（Canvas + UI 层叠） (Phase 1.1)
│   │   ├── articles/
│   │   │   └── [slug]/
│   │   │       ├── page.tsx           — 文章详情页（星球着陆视角） (Phase 2.0)
│   │   │       └── loading.tsx        — 文章加载骨架屏 (Phase 2.0)
│   │   ├── categories/
│   │   │   └── [category]/
│   │   │       └── page.tsx           — 分类页（星系筛选视图） (Phase 2.3)
│   │   ├── tags/
│   │   │   └── [tag]/
│   │   │       └── page.tsx           — 标签页（星云聚合视图） (Phase 3.2)
│   │   ├── archives/
│   │   │   └── page.tsx               — 归档页（时间线/星际航线图） (Phase 3.1)
│   │   ├── search/
│   │   │   └── page.tsx               — 搜索结果页 (Phase 3.3)
│   │   ├── about/
│   │   │   └── page.tsx               — 关于页（脉冲星个人简介） (Phase 3.5)
│   │   └── friends/
│   │       └── page.tsx               — 友链页（社交卫星轨道） (Phase 3.6)
│   │
│   ├── (admin_199209173332)/          — 管理后台路由组（隐蔽路径）
│   │   ├── layout.tsx                 — 后台布局（侧边栏 + 认证守卫） (Phase 4.0)
│   │   ├── login/
│   │   │   └── page.tsx               — 管理员登录页（TOTP） (Phase 4.0)
│   │   ├── dashboard/
│   │   │   └── page.tsx               — 仪表盘（统计概览） (Phase 4.1)
│   │   ├── posts/
│   │   │   ├── page.tsx               — 文章管理列表 (Phase 4.2)
│   │   │   ├── new/
│   │   │   │   └── page.tsx           — 新建文章（Monaco 编辑器） (Phase 4.2)
│   │   │   └── [id]/
│   │   │       └── edit/
│   │   │           └── page.tsx       — 编辑文章 (Phase 4.2)
│   │   ├── categories/
│   │   │   └── page.tsx               — 分类管理 (Phase 4.3)
│   │   ├── tags/
│   │   │   └── page.tsx               — 标签管理 (Phase 4.3)
│   │   ├── comments/
│   │   │   └── page.tsx               — 评论审核 (Phase 4.3)
│   │   ├── friends/
│   │   │   └── page.tsx               — 友链管理 (Phase 4.3)
│   │   ├── media/
│   │   │   └── page.tsx               — 媒体库管理 (Phase 4.4)
│   │   ├── settings/
│   │   │   └── page.tsx               — 站点设置 (Phase 4.4)
│   │   └── newsletter/
│   │       └── page.tsx               — 邮件订阅管理 (Phase 4.4)
│   │
│   └── api/                           — Next.js API Routes（BFF 层）
│       ├── revalidate/
│       │   └── route.ts               — ISR 按需重新验证接口 (Phase 2.0)
│       └── og/
│           └── route.tsx              — Open Graph 动态图片生成 (Phase 4.5)
│
├── components/
│   ├── canvas/                        — 3D 场景组件（R3F）
│   │   ├── Universe.tsx               — 顶层 Canvas 容器，组合所有 3D 子场景 (Phase 1.1)
│   │   ├── Galaxy.tsx                 — 银河系整体场景（星球轨道容器） (Phase 1.1)
│   │   ├── Planet.tsx                 — 文章星球（球体 + 大气层 + 标签） (Phase 1.2)
│   │   ├── Atmosphere.tsx             — 星球大气层菲涅尔发光效果 (Phase 1.2)
│   │   ├── Starfield.tsx              — 远景星空粒子背景 (Phase 1.1)
│   │   ├── CameraController.tsx       — 相机轨道控制与动画过渡 (Phase 1.3)
│   │   ├── LightingSystem.tsx         — 全局光照系统（恒星光 + 环境光） (Phase 1.1)
│   │   ├── PostEffects.tsx            — 后处理效果（Bloom、色差、噪点） (Phase 1.3)
│   │   ├── CrossFadeLOD.tsx           — 多层次细节平滑过渡 (Phase 2.4)
│   │   ├── SatelliteSwarm.tsx         — 评论卫星群（环绕星球的粒子） (Phase 2.2)
│   │   ├── AsteroidBelt.tsx           — 分类小行星带 (Phase 2.3)
│   │   ├── Wormhole.tsx               — 虫洞入口效果（文章跳转） (Phase 2.1)
│   │   ├── WormholeCorridor.tsx       — 虫洞穿越过渡动画走廊 (Phase 2.1)
│   │   ├── Pulsar.tsx                 — 脉冲星（博主头像 3D 化） (Phase 3.5)
│   │   ├── GalaxyCoreBlackHole.tsx     — 星系中心超大质量黑洞（引力透镜 + 分类概览） (Phase 3.3)
│   │   ├── StarGate.tsx               — 星门（归档时间入口） (Phase 3.1)
│   │   ├── OnlineUsers.tsx            — 在线用户流星粒子 (Phase 3.7)
│   │   ├── TagNebula.tsx              — 标签星云（3D 词云） (Phase 3.2)
│   │   ├── Constellation.tsx          — 关联文章星座连线 (Phase 3.2)
│   │   ├── SocialSatellites.tsx       — 社交平台卫星轨道（友链） (Phase 3.6)
│   │   └── VisitorGalaxy.tsx          — 访客星系分布可视化 (Phase 3.7)
│   │
│   ├── ui/                            — 2D UI 组件
│   │   ├── ArticleReader.tsx          — 文章正文阅读面板（Markdown 渲染容器） (Phase 2.0)
│   │   ├── CommentHUD.tsx             — 评论 HUD 面板（发表 + 列表 + 嵌套回复） (Phase 2.2)
│   │   ├── CRTTerminal.tsx            — CRT 终端风格面板（命令行交互壳） (Phase 1.3)
│   │   ├── MiniMap.tsx                — 3D 场景小地图（雷达样式） (Phase 2.4)
│   │   ├── Breadcrumb.tsx             — 面包屑导航 (Phase 2.0)
│   │   ├── Compass.tsx                — 3D 导航罗盘指示器 (Phase 2.4)
│   │   ├── QuickJump.tsx              — 快捷跳转菜单（分类/标签速览） (Phase 2.4)
│   │   ├── SearchOverlay.tsx          — 全屏搜索覆盖层 (Phase 3.3)
│   │   ├── CosmicLoader.tsx           — 宇宙主题加载动画 (Phase 1.1)
│   │   ├── AudioControl.tsx           — 背景音效开关控制 (Phase 3.4)
│   │   ├── ReadingProgress.tsx        — 阅读进度指示器（轨道进度条） (Phase 2.0)
│   │   ├── TableOfContents.tsx        — 文章目录侧边栏 (Phase 2.0)
│   │   ├── ShareBar.tsx               — 社交分享工具栏 (Phase 2.5)
│   │   ├── ImageLightbox.tsx          — 图片灯箱放大查看 (Phase 2.5)
│   │   ├── ArticleNavigation.tsx      — 上一篇/下一篇导航 (Phase 2.5)
│   │   ├── ArticleMeta.tsx            — 文章元信息（日期、字数、分类） (Phase 2.0)
│   │   ├── AuthorCard.tsx             — 作者信息卡片 (Phase 2.5)
│   │   ├── PulsarProfile.tsx          — 脉冲星个人简介 UI 面板 (Phase 3.5)
│   │   ├── InspirationToast.tsx       — 随机灵感 Toast 提示 (Phase 3.5)
│   │   ├── AsteroidEditor.tsx         — 分类/标签编辑器（管理端） (Phase 4.3)
│   │   ├── CommentSortControl.tsx     — 评论排序切换控件 (Phase 2.2)
│   │   ├── ReactionBar.tsx            — 文章表情反应栏 (Phase 2.5)
│   │   ├── CosmicAvatar.tsx           — 宇宙风格用户头像生成 (Phase 2.2)
│   │   ├── WormholePreview.tsx        — 虫洞悬浮预览卡片 (Phase 2.1)
│   │   ├── MonthSelector.tsx          — 归档月份选择器 (Phase 3.1)
│   │   └── QRCodeModal.tsx            — 二维码分享模态框 (Phase 2.5)
│   │
│   ├── ui/markdown/                   — Markdown 扩展渲染组件
│   │   ├── index.tsx                  — Markdown 组件映射注册表 (Phase 2.0)
│   │   ├── CodeBlock.tsx              — 代码块（语法高亮 + 复制） (Phase 2.0)
│   │   ├── MermaidDiagram.tsx         — Mermaid 流程图渲染 (Phase 2.6)
│   │   ├── SandpackPlayground.tsx     — 交互式代码沙盒（Sandpack） (Phase 2.6)
│   │   ├── MathBlock.tsx              — LaTeX 数学公式渲染 (Phase 2.6)
│   │   ├── ImageRenderer.tsx          — 图片增强渲染（懒加载 + 灯箱） (Phase 2.5)
│   │   ├── CalloutBlock.tsx           — 提示/警告/信息卡片块 (Phase 2.6)
│   │   ├── HeadingAnchor.tsx          — 标题锚点链接 (Phase 2.0)
│   │   ├── TableWrapper.tsx           — 响应式表格包装器 (Phase 2.6)
│   │   └── LinkCard.tsx               — 外部链接卡片预览 (Phase 2.6)
│   │
│   ├── debug/                         — 开发调试组件
│   │   └── PerfOverlay.tsx            — 性能监控覆盖层（FPS、内存、Draw Calls） (Phase 1.3)
│   │
│   ├── fallback/                      — 降级/错误组件
│   │   ├── FlatCosmicView.tsx         — 3D 不可用时的 2D 宇宙降级视图 (Phase 1.3)
│   │   └── SignalLost.tsx             — 网络错误/数据加载失败（信号丢失） (Phase 1.3)
│   │
│   └── admin/                         — 管理后台组件
│       ├── AdminSidebar.tsx           — 后台侧边栏导航 (Phase 4.0)
│       ├── AdminHeader.tsx            — 后台顶部栏（用户信息 + 登出） (Phase 4.0)
│       ├── StatsCard.tsx              — 统计数字卡片 (Phase 4.1)
│       ├── TrafficChart.tsx           — 流量趋势图表 (Phase 4.1)
│       ├── PostTable.tsx              — 文章列表表格 (Phase 4.2)
│       ├── EditorToolbar.tsx          — Monaco 编辑器工具栏 (Phase 4.2)
│       ├── PreviewPanel.tsx           — 文章实时预览面板 (Phase 4.2)
│       ├── MediaUploader.tsx          — 文件上传组件（拖拽 + 进度） (Phase 4.4)
│       ├── CommentModeration.tsx      — 评论审核面板 (Phase 4.3)
│       └── TOTPSetup.tsx              — TOTP 二步验证设置 (Phase 4.0)
│
├── hooks/                             — 自定义 React Hooks
│   ├── useArticles.ts                 — 文章数据查询与缓存 Hook (Phase 2.0)
│   ├── useArticleDetail.ts            — 单篇文章详情查询 Hook (Phase 2.0)
│   ├── useCategories.ts               — 分类数据 Hook (Phase 2.3)
│   ├── useTags.ts                     — 标签数据 Hook (Phase 3.2)
│   ├── useComments.ts                 — 评论查询与提交 Hook (Phase 2.2)
│   ├── useSearch.ts                   — 全文搜索 Hook (Phase 3.3)
│   ├── useArchives.ts                 — 归档数据 Hook (Phase 3.1)
│   ├── useFriendLinks.ts              — 友链数据 Hook (Phase 3.6)
│   ├── useOnlineUsers.ts              — WebSocket 在线用户 Hook (Phase 3.7)
│   ├── useAudio.ts                    — 音效播放控制 Hook (Phase 3.4)
│   ├── useCameraAnimation.ts          — 相机动画过渡 Hook (Phase 1.3)
│   ├── useOrbitLayout.ts              — 星球轨道布局计算 Hook (Phase 1.2)
│   ├── useDeviceCapability.ts         — 设备性能检测与降级 Hook (Phase 1.3)
│   ├── useKeyboardNav.ts              — 键盘快捷键导航 Hook (Phase 2.4)
│   ├── useReadingProgress.ts          — 阅读进度计算 Hook (Phase 2.0)
│   ├── useIntersectionObserver.ts     — 元素可见性观察 Hook (Phase 2.0)
│   ├── useMediaQuery.ts               — 响应式媒体查询 Hook (Phase 1.0)
│   ├── useDebounce.ts                 — 防抖 Hook (Phase 1.0)
│   └── useThrottle.ts                 — 节流 Hook (Phase 1.0)
│
├── stores/                            — Zustand 状态管理
│   ├── useNavigationStore.ts          — 导航状态（当前星球、视角、路径） (Phase 1.1)
│   ├── useSceneStore.ts               — 3D 场景状态（质量等级、加载进度） (Phase 1.1)
│   ├── useUIStore.ts                  — UI 面板状态（面板开关、搜索覆盖层） (Phase 1.3)
│   ├── useAudioStore.ts               — 音效状态（静音、音量、当前曲目） (Phase 3.4)
│   ├── useAuthStore.ts                — 管理员认证状态 (Phase 4.0)
│   └── useEditorStore.ts              — 文章编辑器状态（草稿、预览模式） (Phase 4.2)
│
├── animations/                        — GSAP 动画函数
│   ├── cameraTransitions.ts           — 相机飞行路径动画（星球间穿越） (Phase 1.3)
│   ├── panelAnimations.ts             — UI 面板滑入/滑出动画 (Phase 2.0)
│   ├── wormholeSequence.ts            — 虫洞穿越完整动画序列 (Phase 2.1)
│   ├── textReveal.ts                  — CRT 打字机文字揭示动画 (Phase 1.3)
│   ├── planetLanding.ts               — 星球着陆视角动画 (Phase 2.0)
│   └── pageTransitions.ts             — 页面路由过渡动画 (Phase 2.1)
│
├── shaders/                           — GLSL 着色器
│   ├── atmosphere.vert                — 大气层顶点着色器 (Phase 1.2)
│   ├── atmosphere.frag                — 大气层片段着色器（菲涅尔散射） (Phase 1.2)
│   ├── planet.vert                    — 星球表面顶点着色器 (Phase 1.2)
│   ├── planet.frag                    — 星球表面片段着色器（昼夜面） (Phase 1.2)
│   ├── starfield.vert                 — 星空粒子顶点着色器 (Phase 1.1)
│   ├── starfield.frag                 — 星空粒子片段着色器（闪烁） (Phase 1.1)
│   ├── wormhole.vert                  — 虫洞扭曲顶点着色器 (Phase 2.1)
│   ├── wormhole.frag                  — 虫洞片段着色器（事件视界） (Phase 2.1)
│   ├── nebula.vert                    — 星云粒子顶点着色器 (Phase 3.2)
│   ├── nebula.frag                    — 星云体积雾片段着色器 (Phase 3.2)
│   ├── blackhole.vert                 — 黑洞引力透镜顶点着色器 (Phase 3.3)
│   ├── blackhole.frag                 — 黑洞吸积盘片段着色器 (Phase 3.3)
│   └── crt.frag                       — CRT 显示器扫描线后处理 (Phase 1.3)
│
├── utils/                             — 工具函数
│   ├── apollo-client.ts               — Apollo Client 实例配置 (Phase 2.0)
│   ├── graphql/
│   │   ├── queries.ts                 — GraphQL 查询语句定义 (Phase 2.0)
│   │   ├── mutations.ts               — GraphQL 变更语句定义 (Phase 2.2)
│   │   ├── subscriptions.ts           — GraphQL 订阅语句定义 (Phase 3.7)
│   │   └── fragments.ts              — GraphQL 片段复用定义 (Phase 2.0)
│   ├── orbit-calculator.ts            — 轨道半径/角度分配算法 (Phase 1.2)
│   ├── color-mapper.ts                — 分类到星球颜色映射 (Phase 1.2)
│   ├── slug.ts                        — URL slug 生成与解析 (Phase 2.0)
│   ├── date.ts                        — 日期格式化工具（dayjs 封装） (Phase 2.0)
│   ├── reading-time.ts                — 阅读时间估算 (Phase 2.0)
│   ├── device-detect.ts               — 设备 GPU/性能检测 (Phase 1.3)
│   ├── math.ts                        — 3D 数学工具（向量、插值） (Phase 1.2)
│   ├── sanitize.ts                    — 用户输入 HTML 清理 (Phase 2.2)
│   ├── storage.ts                     — LocalStorage 封装 (Phase 1.0)
│   └── constants.ts                   — 全局常量定义 (Phase 1.0)
│
├── workers/                           — Web Workers
│   ├── orbit.worker.ts                — 轨道计算 Worker（offload 主线程） (Phase 2.4)
│   ├── search.worker.ts               — 客户端搜索索引 Worker (Phase 3.3)
│   └── physics.worker.ts              — 粒子物理模拟 Worker (Phase 2.4)
│
├── locales/                           — i18n 国际化翻译
│   ├── zh/
│   │   ├── common.json                — 中文通用翻译 (Phase 3.8)
│   │   ├── blog.json                  — 中文博客翻译 (Phase 3.8)
│   │   └── admin.json                 — 中文后台翻译 (Phase 4.0)
│   └── en/
│       ├── common.json                — 英文通用翻译 (Phase 3.8)
│       ├── blog.json                  — 英文博客翻译 (Phase 3.8)
│       └── admin.json                 — 英文后台翻译 (Phase 4.0)
│
└── styles/                            — 全局样式
    ├── cosmic-theme.css               — 宇宙主题 CSS 变量 (Phase 1.0)
    ├── crt-effects.css                — CRT 扫描线、闪烁 CSS 动画 (Phase 1.3)
    ├── markdown.css                   — Markdown 正文排版样式 (Phase 2.0)
    ├── scrollbar.css                  — 自定义滚动条样式 (Phase 1.0)
    └── fonts.css                      — 字体声明与回退 (Phase 1.0)
```

---

## backend/ — Go 后端服务

```
backend/
├── go.mod                             — Go 模块定义 (Phase 1.0)
├── go.sum                             — 依赖校验和 (Phase 1.0)
├── Dockerfile                         — 后端容器镜像构建 (Phase 5.0)
├── .air.toml                          — Air 热重载配置（开发环境） (Phase 1.0)
├── sqlc.yaml                          — sqlc 代码生成配置 (Phase 1.0)
├── gqlgen.yml                         — gqlgen GraphQL 代码生成配置 (Phase 2.0)
│
├── cmd/
│   ├── server/
│   │   └── main.go                    — HTTP 服务主入口（启动 Fiber + GraphQL） (Phase 1.0)
│   └── seed/
│       └── main.go                    — 种子数据填充工具（开发/测试用） (Phase 1.5)
│
├── internal/
│   ├── config/
│   │   └── config.go                  — 配置加载与校验（Viper） (Phase 1.0)
│   │
│   ├── api/
│   │   ├── router.go                  — Fiber 路由注册总入口 (Phase 1.0)
│   │   └── v1/
│   │       ├── article_handler.go     — 文章 RESTful 接口（CRUD） (Phase 2.0)
│   │       ├── category_handler.go    — 分类接口 (Phase 2.3)
│   │       ├── tag_handler.go         — 标签接口 (Phase 3.2)
│   │       ├── comment_handler.go     — 评论接口 (Phase 2.2)
│   │       ├── auth_handler.go        — 认证接口（登录、刷新、TOTP） (Phase 4.0)
│   │       ├── upload_handler.go      — 文件上传接口 (Phase 4.4)
│   │       ├── search_handler.go      — 搜索接口 (Phase 3.3)
│   │       ├── stats_handler.go       — 统计数据接口 (Phase 4.1)
│   │       ├── archive_handler.go     — 归档接口 (Phase 3.1)
│   │       ├── friend_handler.go      — 友链接口 (Phase 3.6)
│   │       ├── profile_handler.go     — 个人简介接口 (Phase 3.5)
│   │       ├── reaction_handler.go    — 表情反应接口 (Phase 2.5)
│   │       ├── feed_handler.go        — RSS/Atom Feed 接口 (Phase 4.5)
│   │       ├── newsletter_handler.go  — 邮件订阅接口 (Phase 4.4)
│   │       ├── physics_handler.go     — 天体物理参数接口（轨道数据） (Phase 1.2)
│   │       └── health_handler.go      — 健康检查接口 (Phase 1.0)
│   │
│   ├── auth/
│   │   ├── jwt.go                     — JWT Token 签发与验证 (Phase 4.0)
│   │   ├── totp.go                    — TOTP 二步验证逻辑 (Phase 4.0)
│   │   └── password.go               — 密码哈希（Argon2id） (Phase 4.0)
│   │
│   ├── database/
│   │   ├── postgres.go                — PostgreSQL 连接池（pgxpool） (Phase 1.0)
│   │   ├── id.go                      — 分布式 ID 生成器（Snowflake/ULID） (Phase 1.0)
│   │   └── migration.go              — 数据库迁移执行器 (Phase 1.0)
│   │
│   ├── middleware/
│   │   ├── cors.go                    — 跨域请求中间件 (Phase 1.0)
│   │   ├── auth.go                    — JWT 认证守卫中间件 (Phase 4.0)
│   │   ├── ratelimit.go              — 请求速率限制中间件 (Phase 1.5)
│   │   ├── logger.go                  — 结构化日志中间件 (Phase 1.0)
│   │   ├── recovery.go               — Panic 恢复中间件 (Phase 1.0)
│   │   ├── requestid.go              — 请求 ID 注入中间件 (Phase 1.0)
│   │   └── cache.go                   — HTTP 缓存控制中间件 (Phase 2.4)
│   │
│   ├── errors/
│   │   └── errors.go                  — 统一错误码与错误响应定义 (Phase 1.0)
│   │
│   ├── validator/
│   │   └── validator.go               — 请求参数校验器封装 (Phase 1.0)
│   │
│   ├── cache/
│   │   ├── redis.go                   — Redis 客户端连接与基础操作 (Phase 1.5)
│   │   ├── article_cache.go           — 文章缓存策略 (Phase 2.0)
│   │   ├── stats_cache.go             — 统计数据缓存 (Phase 4.1)
│   │   └── invalidator.go            — 缓存失效通知器 (Phase 2.4)
│   │
│   ├── physics/
│   │   ├── orbit_allocator.go         — 轨道半径分配算法（黄金比例） (Phase 1.2)
│   │   ├── aesthetics.go              — 美学约束（最小间距、视觉平衡） (Phase 1.2)
│   │   ├── layout_stabilizer.go       — 布局稳定器（增量更新不跳变） (Phase 1.2)
│   │   └── planet_params.go           — 星球参数计算（大小、颜色、纹理映射） (Phase 1.2)
│   │
│   ├── relation/
│   │   └── relation.go                — 文章关联度计算（标签重叠 + TF-IDF） (Phase 3.2)
│   │
│   ├── search/
│   │   └── search.go                  — 全文搜索引擎（PostgreSQL tsvector） (Phase 3.3)
│   │
│   ├── stats/
│   │   ├── collector.go               — 访问数据采集器（PV/UV） (Phase 4.1)
│   │   └── aggregator.go              — 统计数据聚合（日/周/月） (Phase 4.1)
│   │
│   ├── upload/
│   │   ├── uploader.go                — 文件上传处理（类型校验、压缩） (Phase 4.4)
│   │   └── storage.go                 — 文件存储后端抽象（本地/S3） (Phase 4.4)
│   │
│   ├── feed/
│   │   └── rss.go                     — RSS/Atom Feed 生成器 (Phase 4.5)
│   │
│   ├── export/
│   │   └── exporter.go                — 数据导出（JSON/Markdown 批量导出） (Phase 4.5)
│   │
│   ├── antispam/
│   │   └── antispam.go                — 评论反垃圾检测（关键词 + 频率） (Phase 2.2)
│   │
│   ├── ws/
│   │   ├── hub.go                     — WebSocket 连接管理中心 (Phase 3.7)
│   │   ├── client.go                  — WebSocket 单个客户端连接 (Phase 3.7)
│   │   └── message.go                 — WebSocket 消息类型定义 (Phase 3.7)
│   │
│   ├── profile/
│   │   └── profile.go                 — 博主个人简介管理 (Phase 3.5)
│   │
│   ├── friendlink/
│   │   └── friendlink.go              — 友链 CRUD 与健康检查 (Phase 3.6)
│   │
│   ├── notification/
│   │   └── notification.go            — 站内通知（新评论、新订阅提醒） (Phase 4.3)
│   │
│   ├── webhook/
│   │   └── webhook.go                 — Webhook 通知推送（部署、评论回调） (Phase 4.5)
│   │
│   └── newsletter/
│       └── newsletter.go              — 邮件订阅管理（订阅/退订/发送） (Phase 4.4)
│
├── graph/                             — gqlgen GraphQL 层
│   ├── schema.graphqls                — GraphQL Schema 定义 (Phase 2.0)
│   ├── schema.resolvers.go            — Schema Resolver 实现（自动生成 + 手写） (Phase 2.0)
│   ├── model/
│   │   └── models_gen.go              — gqlgen 生成的 Go 模型 (Phase 2.0)
│   ├── generated/
│   │   └── generated.go               — gqlgen 生成的运行时代码 (Phase 2.0)
│   └── resolver.go                    — Resolver 依赖注入根结构体 (Phase 2.0)
│
├── migrations/                        — 数据库迁移文件
│   ├── 000001_create_articles.up.sql     — 创建文章表 (Phase 1.0)
│   ├── 000001_create_articles.down.sql   — 回滚文章表 (Phase 1.0)
│   ├── 000002_create_categories.up.sql   — 创建分类表 (Phase 1.0)
│   ├── 000002_create_categories.down.sql — 回滚分类表 (Phase 1.0)
│   ├── 000003_create_tags.up.sql         — 创建标签表 (Phase 1.0)
│   ├── 000003_create_tags.down.sql       — 回滚标签表 (Phase 1.0)
│   ├── 000004_create_comments.up.sql     — 创建评论表（树形结构） (Phase 2.2)
│   ├── 000004_create_comments.down.sql   — 回滚评论表 (Phase 2.2)
│   ├── 000005_create_admins.up.sql       — 创建管理员表 (Phase 4.0)
│   ├── 000005_create_admins.down.sql     — 回滚管理员表 (Phase 4.0)
│   ├── 000006_create_friend_links.up.sql    — 创建友链表 (Phase 3.6)
│   ├── 000006_create_friend_links.down.sql  — 回滚友链表 (Phase 3.6)
│   ├── 000007_create_reactions.up.sql    — 创建表情反应表 (Phase 2.5)
│   ├── 000007_create_reactions.down.sql  — 回滚表情反应表 (Phase 2.5)
│   ├── 000008_create_newsletters.up.sql  — 创建邮件订阅表 (Phase 4.4)
│   ├── 000008_create_newsletters.down.sql — 回滚邮件订阅表 (Phase 4.4)
│   ├── 000009_create_stats.up.sql        — 创建访问统计表 (Phase 4.1)
│   ├── 000009_create_stats.down.sql      — 回滚访问统计表 (Phase 4.1)
│   ├── 000010_create_media.up.sql        — 创建媒体资源表 (Phase 4.4)
│   └── 000010_create_media.down.sql      — 回滚媒体资源表 (Phase 4.4)
│
└── sqlc/                              — sqlc 查询定义
    ├── queries/
    │   ├── articles.sql               — 文章 CRUD SQL 查询 (Phase 2.0)
    │   ├── categories.sql             — 分类 CRUD SQL 查询 (Phase 2.3)
    │   ├── tags.sql                   — 标签 CRUD SQL 查询 (Phase 3.2)
    │   ├── comments.sql               — 评论 CRUD SQL 查询 (Phase 2.2)
    │   ├── admins.sql                 — 管理员查询 (Phase 4.0)
    │   ├── friend_links.sql           — 友链查询 (Phase 3.6)
    │   ├── reactions.sql              — 表情反应查询 (Phase 2.5)
    │   ├── newsletters.sql            — 邮件订阅查询 (Phase 4.4)
    │   ├── stats.sql                  — 统计查询 (Phase 4.1)
    │   ├── media.sql                  — 媒体资源查询 (Phase 4.4)
    │   └── search.sql                 — 全文搜索查询 (Phase 3.3)
    └── generated/                     — sqlc 自动生成的 Go 代码
        ├── db.go                      — 数据库接口 (Phase 1.0)
        ├── models.go                  — 数据模型结构体 (Phase 1.0)
        ├── articles.sql.go            — 文章查询实现 (Phase 2.0)
        ├── categories.sql.go          — 分类查询实现 (Phase 2.3)
        ├── tags.sql.go                — 标签查询实现 (Phase 3.2)
        ├── comments.sql.go            — 评论查询实现 (Phase 2.2)
        ├── admins.sql.go              — 管理员查询实现 (Phase 4.0)
        ├── friend_links.sql.go        — 友链查询实现 (Phase 3.6)
        ├── reactions.sql.go           — 表情反应查询实现 (Phase 2.5)
        ├── newsletters.sql.go         — 邮件订阅查询实现 (Phase 4.4)
        ├── stats.sql.go               — 统计查询实现 (Phase 4.1)
        ├── media.sql.go               — 媒体资源查询实现 (Phase 4.4)
        └── search.sql.go              — 搜索查询实现 (Phase 3.3)
```

---

## shared/ — 共享 TypeScript 类型（@cybergeek/shared）

```
shared/
├── package.json                       — @cybergeek/shared 包定义 (Phase 1.0)
├── tsconfig.json                      — TypeScript 配置 (Phase 1.0)
├── src/
│   ├── index.ts                       — 导出入口 (Phase 1.0)
│   ├── types/
│   │   ├── article.ts                 — 文章类型定义 (Phase 2.0)
│   │   ├── category.ts               — 分类类型定义 (Phase 2.3)
│   │   ├── tag.ts                     — 标签类型定义 (Phase 3.2)
│   │   ├── comment.ts                — 评论类型定义 (Phase 2.2)
│   │   ├── user.ts                    — 用户/管理员类型定义 (Phase 4.0)
│   │   ├── reaction.ts               — 表情反应类型定义 (Phase 2.5)
│   │   ├── friend-link.ts            — 友链类型定义 (Phase 3.6)
│   │   ├── stats.ts                   — 统计数据类型定义 (Phase 4.1)
│   │   ├── media.ts                   — 媒体资源类型定义 (Phase 4.4)
│   │   ├── newsletter.ts             — 邮件订阅类型定义 (Phase 4.4)
│   │   └── websocket.ts              — WebSocket 消息类型定义 (Phase 3.7)
│   ├── constants/
│   │   ├── physics.ts                 — 天体物理常量（轨道参数） (Phase 1.2)
│   │   ├── theme.ts                   — 宇宙主题色值常量 (Phase 1.0)
│   │   └── limits.ts                  — 业务限制常量（字数、大小） (Phase 1.0)
│   └── enums/
│       ├── article-status.ts          — 文章状态枚举 (Phase 2.0)
│       ├── comment-status.ts          — 评论状态枚举 (Phase 2.2)
│       └── quality-level.ts           — 渲染质量等级枚举 (Phase 1.3)
```

---

## nginx/ — Nginx 反向代理配置

```
nginx/
├── nginx.conf                         — Nginx 主配置文件 (Phase 5.0)
├── conf.d/
│   ├── default.conf                   — 默认站点配置（前端 + API 反代） (Phase 5.0)
│   ├── ssl.conf                       — SSL/TLS 证书配置 (Phase 5.0)
│   ├── cache.conf                     — 静态资源缓存策略 (Phase 5.0)
│   ├── gzip.conf                      — Gzip 压缩配置 (Phase 5.0)
│   ├── security.conf                  — 安全头配置（CSP、HSTS） (Phase 5.0)
│   └── websocket.conf                 — WebSocket 反代配置 (Phase 5.0)
└── certs/                             — SSL 证书存放目录（.gitignore）
    └── .gitkeep                       — 占位文件 (Phase 5.0)
```

---

## scripts/ — 运维与部署脚本

```
scripts/
├── setup.sh                           — 开发环境一键初始化 (Phase 1.0)
├── dev.sh                             — 启动本地开发环境（前后端 + DB） (Phase 1.0)
├── build.sh                           — 生产环境构建脚本 (Phase 5.0)
├── deploy.sh                          — 服务器部署脚本 (Phase 5.0)
├── backup-db.sh                       — 数据库备份脚本 (Phase 5.0)
├── restore-db.sh                      — 数据库恢复脚本 (Phase 5.0)
├── generate-sqlc.sh                   — sqlc 代码生成脚本 (Phase 1.0)
├── generate-gql.sh                    — gqlgen 代码生成脚本 (Phase 2.0)
└── seed.sh                            — 运行种子数据填充 (Phase 1.5)
```

---

## docs/ — 项目规范文档

```
docs/
├── API.md                             — REST + GraphQL API 文档 (Phase 2.0)
├── ARCHITECTURE.md                    — 系统架构设计文档 (Phase 1.0)
├── DEPLOYMENT.md                      — 部署运维指南 (Phase 5.0)
├── CONTRIBUTING.md                    — 开发贡献指南 (Phase 1.0)
└── CHANGELOG.md                       — 版本更新日志 (Phase 1.0)
```

---

## .github/ — GitHub Actions CI/CD

```
.github/
├── workflows/
│   ├── ci.yml                         — PR 持续集成（Lint + Test + Build） (Phase 5.0)
│   ├── deploy-prod.yml                — 生产环境自动部署 (Phase 5.0)
│   └── deploy-staging.yml             — 预发布环境部署 (Phase 5.0)
├── ISSUE_TEMPLATE/
│   ├── bug_report.md                  — Bug 报告模板 (Phase 5.0)
│   └── feature_request.md             — 功能请求模板 (Phase 5.0)
└── PULL_REQUEST_TEMPLATE.md           — PR 模板 (Phase 5.0)
```

---

## Phase 阶段说明

| Phase | 里程碑 | 核心目标 |
|-------|--------|----------|
| **1.0** | 基础设施 | 项目脚手架、数据库、开发环境 |
| **1.1** | 3D 宇宙场景 | 星空、银河、基础渲染管线 |
| **1.2** | 星球系统 | 文章星球、轨道分配、大气层 |
| **1.3** | 交互与降级 | 相机控制、CRT 终端、性能降级 |
| **1.5** | 数据种子 | 种子数据、速率限制、Redis |
| **2.0** | 文章系统 | 文章 CRUD、GraphQL、Markdown 渲染 |
| **2.1** | 虫洞导航 | 虫洞穿越、页面过渡动画 |
| **2.2** | 评论系统 | 评论 CRUD、卫星可视化、反垃圾 |
| **2.3** | 分类系统 | 分类管理、小行星带 |
| **2.4** | 高级交互 | 小地图、LOD、罗盘、缓存 |
| **2.5** | 文章增强 | 分享、反应、灯箱、导航 |
| **2.6** | Markdown 扩展 | Mermaid、Sandpack、LaTeX |
| **3.1** | 归档系统 | 归档页、星门、时间线 |
| **3.2** | 标签与关联 | 标签云、星座连线、关联度 |
| **3.3** | 搜索系统 | 全文搜索、黑洞入口 |
| **3.4** | 音效系统 | 背景音乐、交互音效 |
| **3.5** | 个人简介 | 关于页、脉冲星、灵感 |
| **3.6** | 友链系统 | 友链管理、社交卫星 |
| **3.7** | 实时功能 | WebSocket、在线用户 |
| **3.8** | 国际化 | 中英文翻译 |
| **4.0** | 管理后台 | 登录、布局、认证、TOTP |
| **4.1** | 数据统计 | 仪表盘、流量图表 |
| **4.2** | 内容编辑 | Monaco 编辑器、实时预览 |
| **4.3** | 内容管理 | 分类/标签/评论/友链管理 |
| **4.4** | 媒体与订阅 | 文件上传、邮件订阅 |
| **4.5** | SEO 与输出 | RSS、OG 图片、Sitemap、导出 |
| **5.0** | 部署上线 | Docker、Nginx、CI/CD、SSL |
