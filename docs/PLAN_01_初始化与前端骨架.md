# Phase 0-1: 项目初始化与前端骨架

> 涵盖 Monorepo 搭建、开发环境、代码规范、CI/CD，以及 Next.js + R3F 3D 场景基础。

---

## Phase 0: 项目初始化与基础设施

### 0.1 Monorepo 仓库初始化
- **任务**：创建 Git 仓库，采用 Monorepo 结构划分 `frontend/`、`backend/`、`shared/` 目录
- **技术**：Git、pnpm workspaces（前端）、Go modules（后端）
- **产出**：仓库根目录包含 `.gitignore`、`README.md`、`docker-compose.yml` 占位、CI 配置占位

### 0.2 Docker 开发环境搭建
- **任务**：编写 `docker-compose.dev.yml`，包含 PostgreSQL 15+、Redis 7+、前端 dev server、后端 dev server 四个服务
- **技术**：Docker、Docker Compose
- **产出**：`docker-compose.dev.yml`，一键 `docker compose up` 启动全部开发依赖

### 0.3 代码规范与工具链
- **任务**：配置 ESLint + Prettier（前端）、golangci-lint（后端）；配置 Husky + lint-staged 预提交钩子
- **技术**：ESLint、Prettier、golangci-lint、Husky
- **产出**：统一的代码风格配置文件，提交前自动检查

### 0.4 CI/CD 流水线骨架
- **任务**：编写 GitHub Actions workflow，分别触发前端 lint/build/test 和后端 lint/build/test
- **技术**：GitHub Actions（或 GitLab CI）
- **产出**：`.github/workflows/ci.yml`，PR 合并前自动检查

### 0.5 环境变量与密钥管理
- **任务**：建立分环境配置体系，安全隔离敏感信息：
  - 创建 `.env.example` 模板文件，列出所有环境变量及说明（不含真实值）
  - 分环境配置：`.env.development`（本地开发）、`.env.staging`（预发布）、`.env.production`（生产）
  - 前端变量：`NEXT_PUBLIC_API_URL`、`NEXT_PUBLIC_WS_URL`、`NEXT_PUBLIC_CDN_URL`、`NEXT_PUBLIC_SENTRY_DSN`
  - 后端变量：`DATABASE_URL`、`REDIS_URL`、`JWT_SECRET`、`API_KEY_SALT`、`SMTP_*`（邮件）、`WEBHOOK_HMAC_SECRET`
  - `.gitignore` 中排除所有 `.env.*`（`.env.example` 除外）
  - CI/CD 中使用 GitHub Secrets 注入生产环境变量
  - Docker Compose 通过 `env_file` 引用对应环境配置
- **技术**：dotenv、Next.js 环境变量机制、GitHub Secrets、Docker env_file
- **产出**：`.env.example`，完整的环境变量文档；安全的多环境配置体系

### 0.6 Git 分支策略与协作规范
- **任务**：制定清晰的分支管理和协作流程：
  - 主分支：`main`（生产就绪）、`develop`（开发集成）
  - 功能分支命名：`feat/phase1-starfield`、`fix/camera-animation-jitter`、`chore/update-deps`
  - 提交信息规范：遵循 Conventional Commits（`feat:`、`fix:`、`chore:`、`docs:`）；配置 commitlint 校验
  - PR 流程：功能分支 → `develop`（需 CI 通过）；`develop` → `main`（需 CI 通过 + 手动确认）
  - 版本管理：语义化版本号（SemVer），每次 `main` 合并打 Git Tag
- **技术**：Git Flow 简化版、Conventional Commits、commitlint、semantic-release（可选）
- **产出**：`CONTRIBUTING.md` 协作指南；commitlint 配置；分支保护规则

### 0.7 shared/ 共享类型包
- **任务**：在 `shared/` 目录中定义前后端共享的类型契约：
  - TypeScript 类型定义：`CelestialBody`、`Galaxy`、`Comment`、`User`、`PhysicsParams`、`OrbitalParams` 等核心数据结构
  - GraphQL Schema 类型与 TypeScript 类型保持一致（通过 GraphQL Code Generator 自动生成或手动维护）
  - API 响应格式统一定义：`ApiResponse<T>`、`PaginatedResponse<T>`、错误码枚举
  - 宇宙物理常量共享：天体类型枚举、默认轨道参数范围、颜色方案预设
  - 配置为 pnpm workspace 子包（`@cosmic-engine/shared`），前端可直接 import
- **技术**：TypeScript、pnpm workspaces、GraphQL Code Generator（可选）
- **产出**：`shared/types/`、`shared/constants/`，前后端类型安全的数据契约

---

## Phase 1: 前端骨架与基础 3D 场景

### 1.1 Next.js 项目初始化
- **任务**：使用 `create-next-app` 创建 Next.js 14+ App Router 项目；配置 TypeScript、Tailwind CSS
- **技术**：Next.js 14+、TypeScript、Tailwind CSS
- **产出**：`frontend/` 目录，可运行的 Next.js 空项目，App Router 目录结构

### 1.2 R3F + Drei 集成
- **任务**：安装 `@react-three/fiber`、`@react-three/drei`、`three`；创建全屏 `<Canvas>` 根组件，设置 WebGL 渲染器参数（antialias、alpha、toneMapping）
- **技术**：React Three Fiber、Drei、Three.js
- **产出**：`components/canvas/CosmicCanvas.tsx`，全屏黑色 3D 画布

### 1.3 深空背景与星空粒子
- **任务**：使用 `CubeTextureLoader` 或 Drei `<Stars>` 渲染星空背景；编写星空粒子系统（`BufferGeometry` + `Points`），实现数千颗静态背景星点随机分布
- **技术**：Three.js Points、BufferGeometry、GLSL vertex shader（可选抖动效果）
- **产出**：`components/canvas/Starfield.tsx`，沉浸式深空背景

### 1.4 基础摄像机控制
- **任务**：集成 Drei `<OrbitControls>` 作为开发调试用；编写自定义 `CameraController` 组件，支持 GSAP 驱动的平滑飞行动画（flyTo 目标坐标）
- **技术**：GSAP、Three.js PerspectiveCamera、Drei OrbitControls
- **产出**：`components/canvas/CameraController.tsx`，可通过函数调用平滑移动摄像机到任意 3D 坐标

### 1.5 Zustand 全局状态管理
- **任务**：创建核心 store：`useCosmicStore`（当前聚焦天体、摄像机目标、UI 面板开关状态）；`useUIStore`（侧边栏、HUD 面板可见性）
- **技术**：Zustand
- **产出**：`stores/cosmicStore.ts`、`stores/uiStore.ts`

### 1.6 设计系统与宇宙主题配置
- **任务**：建立统一的宇宙主题设计系统，确保所有 UI 组件视觉一致：
  - Tailwind CSS 自定义主题扩展：
    - 配色：`cosmic-void`（深空黑 #0a0a1a）、`cosmic-nebula`（星云紫 #6b21a8）、`cosmic-glow`（脉冲蓝 #38bdf8）、`cosmic-plasma`（等离子橙 #fb923c）、`cosmic-frost`（冰冻白 #e2e8f0）
    - 字体：正文使用 `Inter`（无衬线）、代码/HUD 使用 `JetBrains Mono`（等宽）、标题可选 `Space Grotesk`
    - 间距/圆角/阴影：定义 HUD 面板、卡片、按钮的统一视觉规范
  - 共享 CSS 变量：`--glow-color`、`--scanline-opacity`、`--hud-border-color` 等，方便 3D 场景中的 `<Html>` 组件引用
  - 组件基础样式：HUD 面板玻璃态（`backdrop-filter: blur + border`）、扫描线效果、发光文字的通用 class
- **技术**：Tailwind CSS 主题扩展、CSS 自定义属性、Google Fonts / 本地字体托管
- **产出**：`tailwind.config.ts` 宇宙主题配置；`styles/cosmic-theme.css` 全局主题变量；`styles/hud.css` HUD 通用样式

### 1.7 SEO 双轨渲染架构
- **任务**：在 Next.js App Router 的 `layout.tsx` 中实现"暗物质层"——对搜索引擎输出语义化 HTML（`<article>`、`<h1>`、结构化数据 JSON-LD）；对真实用户渲染 3D Canvas 覆盖层
- **技术**：Next.js SSR/SSG、React Server Components、JSON-LD
- **产出**：`app/layout.tsx`、`app/page.tsx` 包含 SEO 隐藏层 + 3D 可见层的双轨结构

### 1.8 资源加载与进度系统
- **任务**：使用 Drei `<Loader>` 或自定义 `useProgress` 钩子，在 3D 资源（贴图、模型）加载期间显示宇宙主题加载动画（星尘凝聚进度条）
- **技术**：Drei useProgress、React Suspense
- **产出**：`components/ui/CosmicLoader.tsx`，带视觉反馈的加载界面

### 1.9 PWA 离线支持
- **任务**：配置 Service Worker 缓存策略——已访问的文章页面离线可读（Cache First）；3D 静态资源使用 Stale While Revalidate 策略；支持 `Add to Home Screen` 安装为桌面应用；配置 `manifest.json`（宇宙主题图标、启动画面、深色主题色）
- **技术**：next-pwa 或 Workbox、Web App Manifest
- **产出**：`public/manifest.json`、Service Worker 配置，支持离线阅读和桌面安装

### 1.10 移动端 2D 降级方案
- **任务**：在应用初始化阶段检测设备 WebGL 能力（`WebGLRenderer.capabilities`）和设备性能（`navigator.hardwareConcurrency`、`deviceMemory`）；低端设备或不支持 WebGL2 的浏览器自动切换为 2D 星空主题——CSS 渐变深空背景 + CSS 动画星点 + 传统卡片式文章列表布局；保持视觉风格统一（配色、字体、太空术语）
- **技术**：WebGL 能力检测、CSS 动画降级方案、React 条件渲染、Tailwind CSS
- **产出**：`components/fallback/FlatCosmicView.tsx`，2D 降级视图；`hooks/useDeviceCapability.ts`，设备能力检测 Hook

### 1.11 无障碍适配 (Accessibility)
- **任务**：为 3D 场景中的所有可交互天体添加 ARIA 标注（`aria-label`、`role="button"`）；实现完整的键盘导航——Tab 键在天体间切换焦点、Enter 进入、ESC 返回；尊重 `prefers-reduced-motion` 媒体查询——开启时禁用所有 GSAP 动画和粒子运动，使用即时切换代替；为屏幕阅读器提供 `<article>` 语义层（复用 SEO 暗物质层）
- **技术**：WAI-ARIA、`prefers-reduced-motion`、键盘事件处理、语义化 HTML
- **产出**：`hooks/useAccessibility.ts`，无障碍配置 Hook；所有交互组件的 ARIA 增强

### 1.12 3D 场景错误边界与容错
- **任务**：为 3D 渲染层建立完善的错误恢复机制：
  - React Error Boundary 包裹 `<Canvas>`——WebGL 崩溃或 Shader 编译失败时捕获错误，显示太空主题的错误页面（"信号中断，正在重建连接..."）而非白屏
  - 监听 WebGL 上下文丢失事件（`webglcontextlost`）——在 GPU 资源回收时自动尝试恢复上下文（`webglcontextrestored`），恢复失败则降级到 2D 视图
  - 单个天体组件的隔离错误边界——某个行星 Shader 出错不影响其他天体渲染，出错天体替换为简单的发光球体占位
  - 错误上报：崩溃信息（GPU 型号、浏览器版本、Shader 错误日志）发送到 Sentry
- **技术**：React Error Boundary、WebGL context 事件、Sentry 错误上报
- **产出**：`components/canvas/CanvasErrorBoundary.tsx`，3D 场景容错组件；`components/fallback/SignalLost.tsx`，错误降级页面

### 1.13 音效与氛围系统
- **任务**：为 3D 宇宙场景添加沉浸式音频体验：
  - 背景氛围音：低频太空环境音（深空嗡鸣、星际风声），使用 Web Audio API 无缝循环播放
  - 交互音效：天体悬停（轻柔电子脉冲）、点击进入（引擎启动声）、大气突入（摩擦燃烧音）、虫洞跃迁（频率拉伸声）、卫星发射（能量释放声）
  - 空间化音频（可选）：使用 Three.js `PositionalAudio`，天体音效随摄像机距离远近自动调整音量和声像
  - 音量控制：HUD 面板中的音量滑块；默认静音，用户首次交互后提示开启
  - 尊重用户偏好：记住音量设置（localStorage），`prefers-reduced-motion` 开启时默认关闭音效
- **技术**：Web Audio API、Three.js Audio/PositionalAudio、Howler.js（可选）、localStorage
- **产出**：`hooks/useAudioSystem.ts`，音效管理 Hook；`assets/audio/` 音效资源目录；`components/ui/AudioControl.tsx`，音量控制组件

### 1.14 自适应画质系统
- **任务**：实现运行时动态画质调节，确保不同设备都能流畅体验：
  - FPS 实时监控：在 `useFrame` 中统计帧间隔，维护滚动平均 FPS
  - 画质分级（高/中/低/极低）：
    - 高：全特效（后处理 + 高粒子数 + 精细 Shader）
    - 中：关闭部分后处理（色散、运动模糊）、粒子数减半
    - 低：关闭所有后处理、粒子数降至 1/4、简化行星材质（StandardMaterial 替代 ShaderMaterial）
    - 极低：自动切换到 2D 降级视图
  - 自动调节：连续 3 秒 FPS < 30 自动降一级；连续 10 秒 FPS > 55 自动升一级
  - 用户手动覆盖：设置面板中可手动锁定画质等级
  - 设备像素比（DPR）自适应：高分屏限制 DPR 上限为 1.5（`gl.setPixelRatio`），平衡清晰度与性能
- **技术**：R3F useFrame、`THREE.WebGLRenderer` 参数动态调整、Zustand 画质状态
- **产出**：`hooks/useAdaptiveQuality.ts`，自适应画质 Hook；`stores/qualityStore.ts`，画质设置 store

### 1.15 路由与 3D 场景状态同步
- **任务**：实现浏览器 URL 与 3D 场景状态的双向绑定：
  - URL 映射规则：
    - `/` → 宇宙全景（摄像机在初始位置）
    - `/galaxy/[slug]` → 摄像机飞向对应星系
    - `/post/[slug]` → 触发大气突入动画，进入文章阅读
    - `/archive/[year]` → 虫洞跃迁至对应年份星区
    - `/about` → 摄像机飞向脉冲星
    - `/galaxy/[slug]` → 摄像机飞向对应星系，聚焦中心黑洞
  - 浏览器前进/后退：监听 `popstate` 事件，触发对应的摄像机反向动画（非瞬移，保持动画连续性）
  - 深度链接：用户直接访问 `/post/xxx` 时，场景直接初始化在文章阅读状态（跳过长距离飞行动画，仅播放着陆阶段）
  - URL 状态持久化：可选的查询参数 `?cam=x,y,z` 保存摄像机自由探索位置，方便分享视角
- **技术**：Next.js App Router、`usePathname`/`useSearchParams`、Zustand 中间件与 URL 同步、GSAP 条件动画
- **产出**：`hooks/useSceneRouter.ts`，场景路由同步 Hook；所有页面路由对应的摄像机动画预设

---

## Phase 1 补充: 性能基础设施与编码规范

> 以下为贯穿全项目的性能基础设施，在 Phase 1 建立规范后，后续所有 Phase 遵守执行。

### 1.16 Delta Time 帧率无关动画规范

- **任务**：建立强制编码规范——所有 `useFrame` 中的增量式动画必须乘以 `delta`，确保在 30fps 和 144fps 设备上动画速度一致：
  - 制定规范文件 `ANIMATION_CONVENTIONS.md`，明确区分两类动画：
    - **绝对时间动画**（公转轨道等）：使用 `clock.elapsedTime`，天然帧率无关——`x = r * Math.cos(elapsedTime * speed + offset)`
    - **增量式动画**（自转、粒子漂移、位置逼近等）：必须乘 `delta`——`mesh.rotation.y += rotationSpeed * delta`
  - ESLint 自定义规则（可选）：检测 `useFrame` 回调中的裸增量赋值（`+= 常数` 而非 `+= x * delta`），发出警告
  - **反例**（禁止）：
    ```tsx
    useFrame(() => {
      mesh.rotation.y += 0.01  // 144fps 时转速是 30fps 的 4.8 倍
    })
    ```
  - **正例**（强制）：
    ```tsx
    useFrame((_, delta) => {
      mesh.rotation.y += ROTATION_SPEED * delta  // 任何帧率下速度一致
    })
    ```
- **技术**：R3F `useFrame` 的 `delta` 参数、编码规范文档
- **产出**：`docs/ANIMATION_CONVENTIONS.md` 动画编码规范；全项目代码审查检查项

### 1.17 R3F 渲染防抖规范（防止无效 re-render）

- **任务**：建立 React/R3F 层面的渲染优化规范，防止 React reconciliation 引起的 3D 场景无效重绘：
  - **Zustand selector 精确订阅**（强制）：
    ```tsx
    // 禁止: 订阅整个 store，任何字段变更都触发 re-render
    const store = useCosmicStore()

    // 强制: 仅订阅需要的字段
    const focusedBody = useCosmicStore(s => s.focusedBody)
    ```
  - **3D 组件动画使用 useRef 而非 useState**（强制）：
    ```tsx
    // 禁止: 每帧 setState 导致每帧 re-render
    const [rotation, setRotation] = useState(0)
    useFrame(() => setRotation(r => r + 0.01))

    // 强制: 直接操作 ref，零 re-render
    const meshRef = useRef<THREE.Mesh>(null!)
    useFrame((_, delta) => { meshRef.current.rotation.y += speed * delta })
    ```
  - **大列表组件隔离**：卫星群、小行星带等包含大量子组件的容器，使用 `React.memo` 包裹每个子组件，避免父组件状态变更导致全部子组件重渲染
  - **事件回调稳定化**：传入 3D 组件的 `onClick`、`onPointerOver` 等回调使用 `useCallback` 包裹，防止回调引用变化触发子树重渲染
  - **开发模式检测**：开发环境下使用 React DevTools Profiler + `<StrictMode>` 双渲染检测不必要的 re-render
- **技术**：Zustand selector、React.memo、useCallback、useRef、React DevTools Profiler
- **产出**：`docs/R3F_PERFORMANCE_RULES.md` R3F 性能编码规范；所有 3D 组件遵循此规范

### 1.18 GPU 资源生命周期管理（dispose 规范）

- **任务**：建立 Three.js GPU 资源的生命周期管理规范，防止内存泄漏：
  - **核心问题**：Three.js 的 Geometry、Material、Texture 在 JS 对象被 GC 回收时，**不会**自动释放 GPU 显存。必须手动调用 `.dispose()`
  - **R3F 自动 dispose**：R3F 组件卸载时自动对直接子元素调用 dispose——但通过 `useLoader`、`new THREE.TextureLoader()` 等手动加载的资源**不在自动管理范围内**
  - **强制规范**：
    - 所有 `useLoader` / `useTexture` 加载的资源，在组件卸载时通过 `useEffect` 清理：
      ```tsx
      useEffect(() => {
        return () => {
          texture.dispose()
          geometry.dispose()
          material.dispose()
        }
      }, [])
      ```
    - LOD 切换时，被替换的高精度 Geometry/Material 必须 dispose
    - 虫洞跃迁离开旧星区时，旧星区的行星纹理必须 dispose
    - RenderTarget（FBO）使用完毕后必须 dispose
  - **泄漏检测**：开发环境下定期输出 `renderer.info`（geometries / textures / programs 数量），监控是否持续增长：
    ```tsx
    useFrame(({ gl }) => {
      if (__DEV__ && frameCount % 300 === 0) {
        console.table(gl.info.memory)  // { geometries, textures }
        console.table(gl.info.render)  // { calls, triangles, points }
      }
    })
    ```
- **技术**：Three.js dispose API、R3F 自动 dispose 机制、`renderer.info` 监控
- **产出**：`docs/GPU_MEMORY_MANAGEMENT.md` 显存管理规范；`hooks/useGPUMemoryMonitor.ts` 开发环境显存监控 Hook

### 1.19 对象池基础设施

- **任务**：建立通用对象池（Object Pool）基础设施，供后续 Phase 中的粒子系统、Trail 效果复用：
  - **核心问题**：卫星发射 Trail、引力坍缩爆炸、虫洞跃迁星线等特效需要频繁创建/销毁粒子对象。频繁 `new` 和 GC 回收会导致帧率抖动（GC pause）
  - **对象池设计**：
    - 预创建固定数量的粒子 Mesh（如 500 个），初始状态为不可见（`visible = false` 或移到视野外）
    - 需要粒子时从池中取出（`acquire()`），设置位置/颜色/生命周期后激活
    - 粒子生命周期结束后归还池中（`release()`），重置属性并隐藏
    - 池耗尽时：根据策略选择丢弃最老粒子或暂时扩容
  - **与 InstancedMesh 结合**：池化的粒子用 InstancedMesh 渲染，归还时将 Matrix 设置为零缩放（视觉消失但无需增删实例）：
    ```tsx
    const tempMatrix = new THREE.Matrix4()
    // 隐藏: scale 设为 0
    tempMatrix.makeScale(0, 0, 0)
    instancedMesh.setMatrixAt(index, tempMatrix)
    // 激活: 设置正常变换
    tempMatrix.compose(position, quaternion, scale)
    instancedMesh.setMatrixAt(index, tempMatrix)
    instancedMesh.instanceMatrix.needsUpdate = true
    ```
- **技术**：设计模式（Object Pool Pattern）、Three.js InstancedMesh、Matrix4 变换
- **产出**：`utils/ObjectPool.ts` 通用对象池类；`utils/InstancedParticlePool.ts` 基于 InstancedMesh 的粒子池

### 1.20 Shader 预编译与预热系统

- **任务**：防止用户首次接近某种天体时因 GPU 即时编译 Shader 导致的 100-500ms 帧冻结：
  - **问题说明**：项目中包含多种自定义 GLSL Shader（Voronoi 降维、黑洞 Raymarching、虫洞 UV 扭曲、行星程序化纹理、Fresnel 大气层等）。每种 Shader 在首次被 GPU 使用时需要编译和链接，这个过程会阻塞主线程
  - **预热策略**：
    - 场景初始化完成、加载动画播放期间（Phase 1.8 的 CosmicLoader），在后台用不可见 Mesh "热身"所有 Shader 程序：
      ```tsx
      // 加载阶段: 创建 1px 的不可见 Mesh 使用每种 ShaderMaterial
      // 渲染 1 帧后移除，Shader 已编译并缓存在 GPU
      const warmupScene = new THREE.Scene()
      allShaderMaterials.forEach(mat => {
        const mesh = new THREE.Mesh(tinyGeometry, mat)
        warmupScene.add(mesh)
      })
      renderer.compile(warmupScene, camera)
      warmupScene.clear()
      ```
    - 利用 Three.js `renderer.compile(scene, camera)` API 触发编译但不实际渲染
    - 加载进度条中展示 "编译着色器 3/7..." 的阶段提示（融入宇宙主题：如"校准引力透镜..."）
  - **可选进阶**：使用 `KHR_parallel_shader_compile` WebGL 扩展（Chrome 支持），异步查询编译完成状态，避免阻塞
- **技术**：Three.js `WebGLRenderer.compile()`、WebGL Shader 编译机制、`KHR_parallel_shader_compile` 扩展
- **产出**：`utils/shaderWarmup.ts` Shader 预热工具；集成到 `CosmicLoader.tsx` 加载流程中

### 1.21 全局 Throttle/Debounce 策略

- **任务**：定义全项目统一的事件节流/防抖策略，防止高频事件导致性能问题：
  - **强制节流的事件**：
    | 事件 | 策略 | 频率 | 原因 |
    |------|------|------|------|
    | `onPointerMove`（3D 场景） | throttle | ≤ 30fps（~33ms） | 射线检测 CPU 开销大 |
    | `window.resize` | debounce | 200ms | Canvas 尺寸调整触发 GPU 资源重建 |
    | `scroll`（文章阅读面板） | throttle | ≤ 10fps（~100ms） | 进度条/TOC 高亮计算 |
    | 搜索输入框 `onChange` | debounce | 300ms | 防止每个按键触发 API 请求 |
    | WebSocket 位置同步（客户端采样） | throttle | 500ms | 减少网络消息量 |
    | 自适应画质 FPS 采样 | 滚动平均 | 每 60 帧一次 | 避免瞬时帧率波动触发频繁画质切换 |
  - **实现方式**：
    - 使用 `lodash-es/throttle` 和 `lodash-es/debounce`（tree-shakeable）
    - R3F 场景内的 `onPointerMove` 通过自定义 Hook 封装节流逻辑
    - 全局 resize 监听器统一注册一个，通过事件总线分发
- **技术**：lodash-es throttle/debounce、requestAnimationFrame 手动节流、自定义 Hook
- **产出**：`hooks/useThrottledPointer.ts` 节流指针 Hook；`hooks/useDebouncedValue.ts` 防抖值 Hook；`docs/EVENT_THROTTLE_POLICY.md` 事件节流策略文档
