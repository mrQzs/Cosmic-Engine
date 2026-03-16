# Phase 4-5: 星系渲染与文章阅读交互

> 涵盖星系/行星 3D 渲染、数据驱动场景、天体交互，以及大气突入阅读体验。

---

## Phase 4: 星系与行星渲染系统

### 4.0 场景坐标体系与空间布局
- **任务**：定义整个宇宙的 3D 空间架构，为所有天体定位提供基准：
  - 坐标尺度约定：1 单位 ≈ 1 AU（天文单位）概念映射，实际数值根据视觉效果调整
  - 宇宙中心（0, 0, 0）：脉冲星（个人简介）所在位置
  - 星系分布：各星系中心坐标由后端 `galaxies.position` JSONB 字段决定，建议在半径 500-2000 的球壳空间内分布，避免重叠（最小间距 300）
  - 星系内部：行星围绕星系中心分布，轨道半径 20-100，由 `orbit_radius` 决定
  - 特殊区域划分：
    - 宇宙核心（r < 50）：脉冲星
    - 星系带（50 < r < 2000）：各星系及其行星
    - 小行星带：分布在星系边缘环带区域
    - 虫洞走廊（特定轴线方向）：时间轴虫洞排列
    - 边境区域（r > 2000）：友链星际门
    - 黑洞区域：偏离主航道的孤立位置
  - 空间分区管理：使用八叉树（Octree）或简单的网格划分，优化射线检测和视锥剔除
  - 后端配置化：管理后台可可视化调整星系坐标，前端实时预览
- **技术**：Three.js Vector3、空间分区算法（可选 Octree）、后端 JSONB 坐标存储
- **产出**：`config/universeLayout.ts` 空间常量与布局规则；`utils/spatialIndex.ts` 空间索引工具（可选）

### 4.0.1 光照系统
- **任务**：设计宇宙场景的光照方案，平衡视觉效果与性能：
  - 全局环境光（`AmbientLight`）：极低强度（0.05-0.1），模拟深空微弱背景辐射，确保远距离天体不完全黑暗
  - 脉冲星点光源（`PointLight`）：位于宇宙中心，高强度 + 大衰减距离，作为主光源照亮核心区域
  - 星系局部光源：每个星系中心放置一个低强度 `PointLight`，为星系内行星提供照明，颜色跟随星系 `color_scheme`
  - 行星自发光：通过 `emissive` 材质属性让行星自身散发微光，不依赖外部光源也有基础可见度
  - 动态光照（可选）：摄像机附近添加弱 `PointLight`（飞船前灯效果），跟随摄像机移动，照亮当前探索区域
  - 性能考量：限制同时激活的光源数量（≤ 8 个），远距离星系光源使用 LOD 关闭；不使用实时阴影（深空场景不需要）
- **技术**：Three.js AmbientLight、PointLight、emissive 材质属性、光源 LOD 管理
- **产出**：`components/canvas/LightingSystem.tsx` 光照管理组件；光照参数可在开发模式下通过 Leva GUI 实时调试

### 4.1 星系（Galaxy）渲染
- **任务**：创建 `<Galaxy>` 组件，包含三层结构：
  - **中心超大质量黑洞**：星系的引力锚点，使用 Raymarching 引力透镜 Shader（详见 PLAN_05 §10.1）。点击黑洞展示分类概览
  - **恒星（子分类）**：围绕中心黑洞公转的 `<Star>` 组件（详见 PLAN_05 §10.3），每颗恒星代表一个子分类
  - **星云背景**：`Points` + Curl Noise 驱动的螺旋臂星云粒子效果，根据后端 `color_scheme` 设置色调
  - LOD 策略——远距离：整个星系显示为模糊光团（含中心亮点 = 黑洞）；中距离：展开星云粒子 + 恒星可见；近距离：行星可见
  - **层级关系**：行星不再直接围绕星系中心公转，而是围绕所属恒星（子分类）公转。空间布局：黑洞在中心 → 恒星在中间环带 → 行星围绕各自恒星
- **技术**：Three.js Points、GLSL Fragment Shader（噪声函数）、LOD、嵌套 Group 层级
- **产出**：`components/canvas/Galaxy.tsx`，包含中心黑洞 + 恒星 + 星云粒子的完整星系组件

### 4.2 行星（Planet）程序化生成
- **任务**：根据 `texture_seed` 和内容驱动美学映射（见算法改造手册 I-1）程序化生成行星表面材质——使用 GLSL Simplex/Perlin Noise 着色器生成地貌纹理；支持多种行星类型（岩石、气态、冰冻）通过内容特征自动决定（而非纯随机 seed）
  - 行星围绕所属恒星（子分类）公转，而非围绕星系中心
  - 如果文章尚未归入任何子分类，行星暂时围绕星系中心黑洞的外围区域游离（"未归类文章"）
- **技术**：Three.js SphereGeometry、GLSL 程序化纹理、ShaderMaterial
- **产出**：`components/canvas/Planet.tsx`，根据内容自动生成有语义的独特外观行星

### 4.3 行星大气层与光晕
- **任务**：为行星添加半透明大气层 Mesh（略大于行星的球体 + 自定义 Fresnel Shader）；实现行星环绕光晕（Glow Effect），使用 `UnrealBloomPass` 后处理或自定义 additive blending sprite
- **技术**：Three.js ShaderMaterial、Fresnel 效果、Post-processing
- **产出**：`components/canvas/Atmosphere.tsx`，行星的大气层和光晕效果

### 4.4 行星轨道与公转动画
- **任务**：根据后端返回的 `orbit_radius`（半长轴 a）、`orbit_eccentricity`（离心率 e，0.05~0.3）、`orbit_inclination`（倾角）参数，在 `useFrame` 中使用**简化开普勒椭圆轨道模型**计算行星公转位置（不使用正圆匀速 `cos/sin`——正圆匀速看起来像钟表齿轮，缺乏真实太空感）：
  - 通过 **Newton-Raphson 迭代**（3 次）求解开普勒方程 `M = E - e * sin(E)`，得到偏近点角 E
  - 椭圆位置：`x = a * (cos(E) - e)`，`z = a * sqrt(1-e²) * sin(E)`
  - 应用轨道倾角旋转矩阵
  - 大行星（长文章、质量大）轨道半径大、公转速度慢（开普勒第三定律简化：`speed ∝ 1/sqrt(r³)`）
  - 绘制半透明椭圆轨道环线（`EllipseCurve` → `Line`）
- **技术**：R3F useFrame、Three.js 数学库、开普勒方程 Newton-Raphson 求解
- **产出**：行星按椭圆轨道变速公转，近日点加速、远日点减速，视觉上有真实天体运行感

### 4.5 GraphQL 数据驱动渲染
- **任务**：前端通过 GraphQL 客户端（urql 或 Apollo）请求宇宙拓扑数据；将返回的 `galaxies -> celestial_bodies` 树结构映射为 R3F 组件树（`<Universe>` → `<Galaxy>` → `<Planet>`）
- **技术**：urql / Apollo Client、GraphQL Code Generator
- **产出**：`hooks/useUniverseData.ts`、`components/canvas/Universe.tsx`，数据驱动的场景树

### 4.6 天体交互（悬停与点击）
- **任务**：使用 R3F 的 `onPointerOver`、`onPointerOut`、`onClick` 事件实现天体交互；悬停高亮（emissive 增强）；点击触发摄像机飞行（调用 CameraController.flyTo）；显示天体信息 HUD 浮窗
- **技术**：R3F 事件系统、Zustand 状态触发、GSAP 摄像机动画
- **产出**：天体可交互，点击后摄像机平滑飞向目标行星

### 4.7 星云标签系统
- **任务**：将文章标签可视化为星系中漂浮的星云体：
  - 每个标签渲染为一团半透明粒子云（`Points` + 噪声驱动的不规则形状）
  - 标签热度（关联文章数）决定星云亮度和体积——热门标签星云更大更亮
  - 同标签文章的行星被该星云包裹或靠近，形成自然的视觉分组
  - 点击星云触发筛选——非该标签的行星降低透明度，摄像机聚焦到标签星云区域
  - HUD 显示标签名称和关联文章数量
- **技术**：Three.js Points、GLSL 噪声 Shader、Zustand 筛选状态、GSAP 过渡动画
- **产出**：`components/canvas/TagNebula.tsx`，标签星云组件；`stores/filterStore.ts`，筛选状态管理

### 4.8 星座关联（相关文章）
- **任务**：相关文章之间用发光连线形成"星座"图案：
  - 后端计算文章关联度（不使用编辑距离——编辑距离是字符级度量，无法捕捉语义相关性，如"Go 并发"和"goroutine 与 channel"编辑距离大但语义极相关），采用**多维度加权评分**：
    - **Jaccard 标签系数**（权重 0.4）：`|tags_A ∩ tags_B| / |tags_A ∪ tags_B|`
    - **pgvector 余弦相似度**（权重 0.5）：基于文章内容的向量嵌入（参见先进算法 pgvector 语义搜索方案），`1 - (embedding_A <=> embedding_B)`
    - **同星系加分**（权重 0.1）：同一分类下的文章关联度基础加 0.1
    - 综合关联度 = 各维度加权求和，超过阈值（如 0.35）的行星之间建立星座连线
  - 关联度超过阈值的行星之间渲染发光连线（`Line2` + 自定义虚线 Shader）
  - 连线亮度反映关联强度；鼠标悬停连线时显示关联原因 tooltip（"共同标签: Go, 并发"或"内容相似度: 87%"）
  - 点击行星时高亮其所有星座连线，方便发现相关阅读
- **技术**：Three.js Line2、GLSL 虚线 Shader、pgvector 余弦相似度、Jaccard 系数
- **产出**：`components/canvas/Constellation.tsx`，星座连线组件；`backend/internal/relation/` 关联计算模块

### 4.9 导航 HUD 与小地图
- **任务**：为用户提供宇宙空间内的方位感知和快速导航：
  - 小地图（Mini-map）：屏幕右下角固定的 2D 俯视图，使用独立的 `OrthographicCamera` 渲染简化版宇宙——星系显示为彩色光点，行星省略，当前摄像机位置显示为闪烁箭头
  - 面包屑导航：屏幕顶部 HUD 显示当前路径层级——`宇宙 > 星系名 > 行星名`，点击任一层级可快速跳转（触发摄像机飞行）
  - 罗盘指示器：画面边缘显示场景外重要天体的方向标记——箭头 + 天体名称 + 距离，指引用户发现未探索的星系（类似游戏中的 POI 标记）
  - 快速跳转菜单：按 `Tab` 或点击 HUD 按钮弹出天体列表面板（按星系分组），选择后直接飞行前往
  - 小地图可拖拽点击：在小地图上点击某位置，摄像机飞向对应的 3D 坐标
- **技术**：R3F 多 Camera 渲染（`useFrame` + `gl.autoClear`）、React HUD 覆盖层、Zustand 导航状态
- **产出**：`components/ui/MiniMap.tsx` 小地图组件；`components/ui/Breadcrumb.tsx` 面包屑导航；`components/ui/Compass.tsx` 罗盘指示器；`components/ui/QuickJump.tsx` 快速跳转面板

### 4.10 搜索结果 3D 可视化
- **任务**：将后端搜索结果映射到 3D 场景中，让用户"看到"搜索结果在宇宙中的位置：
  - 搜索触发：HUD 搜索栏输入关键词 → 调用搜索 API → 返回匹配天体 ID 列表
  - 命中高亮：匹配的行星脉冲式增强发光（emissive 闪烁动画），未命中的天体降低透明度至 0.15
  - 搜索连线：所有命中天体之间绘制微弱发光连线，形成"搜索星图"
  - 自动聚焦：摄像机飞向命中天体的质心位置，调整视野角度（FOV）使所有结果可见
  - 结果列表：HUD 侧边栏显示搜索结果文字列表（标题 + 高亮摘要），点击跳转到对应天体
  - 清除搜索：按 ESC 或点击"清除"恢复所有天体原始状态
- **技术**：Zustand 搜索状态、Three.js emissive 动画、GSAP 摄像机自动框选、React 搜索 UI
- **产出**：`components/ui/SearchOverlay.tsx` 搜索界面；`hooks/useSearchVisualization.ts` 搜索结果 3D 映射 Hook

### 4.11 BVH 加速射线检测

- **任务**：引入 BVH（层级包围体）加速 Raycaster，解决大量天体交互时的性能瓶颈：
  - **问题说明**：R3F 的 `onPointerOver`/`onClick` 底层使用 Three.js `Raycaster`，默认对每个 Mesh 逐一检测包围球。当场景包含数百行星 + 数千卫星 + 5000 小行星时，每次鼠标移动触发的射线检测可能耗时 5-15ms（占帧预算的 30-90%）
  - **解决方案**：
    - 集成 [three-mesh-bvh](https://github.com/gkjohnson/three-mesh-bvh) 库，将射线检测从 O(n) 降至 O(log n)
    - R3F 中使用 drei 的 `<Bvh>` 组件包裹场景根节点即可全局加速：
      ```tsx
      import { Bvh } from '@react-three/drei'
      <Canvas>
        <Bvh firstHitOnly>
          <Universe />  {/* 所有天体自动受益 */}
        </Bvh>
      </Canvas>
      ```
    - `firstHitOnly` 参数：鼠标事件只需要最近的交叉对象，启用后进一步提速
    - InstancedMesh 的射线检测：默认逐实例遍历矩阵，大量实例（>500）时必须自定义 `raycast` 方法或使用空间索引辅助
  - **性能预期**：射线检测耗时从 ~10ms 降至 <0.5ms（20x 加速）
- **技术**：three-mesh-bvh、drei `<Bvh>` 组件、R3F 事件系统
- **产出**：3D 场景根组件集成 BVH 加速；InstancedMesh 自定义射线检测优化

### 4.12 Geometry Merge（几何体合并）

- **任务**：将同类型的静态几何体合并为单个 BufferGeometry，减少 Draw Call：
  - **合并目标**：
    | 合并对象 | 估算 Draw Call 节省 | 合并方式 |
    |----------|-------------------|----------|
    | 行星轨道环线（N 条 Ring） | N → 1 | `mergeGeometries` 合并后用单个 `LineSegments` 渲染 |
    | 星座关联连线 | M → 1 | 所有连线的顶点合并为单个 `LineSegments` |
    | 星系标签 Billboard 背景 | K → 1 | 使用 InstancedMesh 替代多个 Plane |
    | 虫洞走廊引导线 | 连线数 → 1 | 合并为单条 `CatmullRomCurve3` → `TubeGeometry` |
  - **注意事项**：
    - 合并后的几何体无法单独变换（位置/旋转/颜色），仅适用于**静态或整体变换**的对象
    - 需要单独交互的对象（如可点击的轨道线）不应合并
    - 合并操作在数据加载后执行一次，后续天体增减时重新合并（低频操作）
- **技术**：Three.js `BufferGeometryUtils.mergeGeometries()`、`LineSegments`
- **产出**：`utils/geometryMerger.ts` 几何体合并工具函数

### 4.13 Render Target 与离屏渲染

- **任务**：为小地图（§4.9）和虫洞预览（PLAN_05 §8.1.2）提供底层离屏渲染支持：
  - **小地图实现**：
    - 创建独立的 `WebGLRenderTarget`（分辨率 256×256，无需高清）
    - 使用 `OrthographicCamera` 从上方俯视宇宙，渲染简化版场景（仅星系光点 + 摄像机位置箭头）到 RenderTarget
    - 将 RenderTarget 的 texture 绘制到 HUD 层的 `<canvas>` 2D 元素上（避免在 WebGL Canvas 内嵌套 `<Html>`）
    - 刷新频率：每 5 帧更新一次小地图（~12fps），足以反映摄像机移动，节省 80% GPU 开销
  - **虫洞预览**：
    - 虫洞 Torus 中心的纹理为目标星区的低分辨率快照
    - 仅在鼠标悬停虫洞时触发一次 RenderTarget 更新（非持续渲染）
  - **资源管理**：RenderTarget 在组件卸载时必须 `dispose()`（遵循 Phase 1 §1.18 规范）
- **技术**：Three.js `WebGLRenderTarget`、drei `useFBO` Hook、`createPortal`
- **产出**：`hooks/useMiniMapRenderer.ts` 小地图离屏渲染 Hook；虫洞预览纹理渲染逻辑

### 4.14 Lerp/Slerp 平滑插值系统

- **任务**：建立统一的插值工具，供摄像机运动、天体过渡、LOD 切换等场景使用：
  - **问题说明**：项目中大量使用"平滑过渡"（摄像机飞行、卫星轨道重排、在线用户位置同步等），但 GSAP 仅适合**预定义路径**的动画。对于**目标持续变化**的实时跟随（如摄像机跟踪移动天体、网络同步位置），需要基于 Lerp 的逐帧逼近
  - **帧率无关 Lerp**：
    ```tsx
    // 错误: 帧率越高逼近越快
    position.lerp(target, 0.1)

    // 正确: 帧率无关的阻尼逼近
    // smoothFactor 表示"每秒逼近到距离的多少比例"
    const t = 1 - Math.pow(1 - smoothFactor, delta * 60)
    position.lerp(target, t)
    ```
  - **Slerp（球面线性插值）**：用于摄像机朝向的平滑转向——`Quaternion.slerp` 确保旋转走最短弧度路径
  - **封装为 Hook**：
    ```tsx
    function useSmoothLerp(targetRef: RefObject<Vector3>, speed = 5) {
      const current = useRef(new Vector3())
      useFrame((_, delta) => {
        const t = 1 - Math.exp(-speed * delta)
        current.current.lerp(targetRef.current, t)
      })
      return current
    }
    ```
  - **使用场景对照**：
    | 场景 | 方法 | 原因 |
    |------|------|------|
    | 摄像机飞向星系（预定义路径） | GSAP timeline | 路径固定、需要时间线控制 |
    | 摄像机跟踪自转行星 | Lerp 逐帧逼近 | 目标持续移动 |
    | 在线用户飞船位置同步 | Lerp 逐帧逼近 | 网络延迟下的平滑补偿 |
    | 卫星排序切换后的轨道迁移 | GSAP stagger | 需要波纹式延迟控制 |
    | LOD 切换时的材质渐变 | Smoothstep / Lerp | 避免突兀的瞬间切换 |
- **技术**：Three.js `Vector3.lerp`、`Quaternion.slerp`、`MathUtils.lerp`、帧率无关阻尼公式
- **产出**：`hooks/useSmoothLerp.ts`、`hooks/useSmoothSlerp.ts`；`utils/mathHelpers.ts` 中的帧率无关插值函数

---

## Phase 5: 文章阅读交互 —— 大气突入 (Atmospheric Re-entry)

### 5.1 大气突入运镜动画
- **任务**：点击行星后，GSAP 驱动摄像机从当前位置加速冲向行星表面；分三阶段：① 加速接近（1s）② 穿透云层（0.5s，添加运动模糊）③ 减速着陆（0.5s）
- **技术**：GSAP timeline、Three.js camera animation
- **产出**：`animations/atmosphericEntry.ts`，可复用的突入动画函数

### 5.2 后处理特效管线
- **任务**：集成 `@react-three/postprocessing`；突入阶段依次启用：`UnrealBloomPass`（泛光，模拟大气摩擦发光）、`GlitchEffect`（信号撕裂，穿透瞬间）、`ChromaticAberration`（色散）；着陆后逐步关闭特效
- **技术**：react-three-postprocessing、EffectComposer
- **产出**：`components/canvas/PostEffects.tsx`，状态驱动的后处理特效切换

### 5.3 降维着色器 (Voronoi Micro-world)
- **任务**：编写 GLSL Fragment Shader 实现 Voronoi 泰森多边形纹理——行星表面在摄像机极近距离时平滑过渡为发光的细胞/代码网格微观结构；通过 `smoothstep` 基于 camera distance 在宏观纹理和微观纹理间渐变混合
- **技术**：GLSL、Voronoi Noise、ShaderMaterial uniform 动态更新
- **产出**：`shaders/voronoiMicro.glsl`，行星近距离的微观视界着色器

### 5.4 DOM 融合阅读面板
- **任务**：使用 R3F `<Html>` 组件在 3D 场景中嵌入 2D 文章阅读面板；面板样式：毛玻璃背景（`backdrop-filter: blur`）、`mix-blend-mode: screen`、等宽/无衬线字体切换；Markdown 内容渲染（`react-markdown` + `rehype-highlight` 代码高亮）
- **技术**：R3F Html 组件、react-markdown、rehype-highlight、CSS blend modes
- **产出**：`components/ui/ArticleReader.tsx`，镶嵌在 3D 场景中的文章阅读界面

### 5.4.1 Markdown 扩展语法支持
- **任务**：在基础 Markdown 渲染之上，支持技术博客常用的扩展语法：
  - **数学公式**：行内 `$...$` 和块级 `$$...$$` 公式渲染，使用 KaTeX（性能优于 MathJax），集成 `rehype-katex` + `remark-math` 插件
  - **流程图 / 图表**：````mermaid` 代码块自动渲染为 Mermaid 图表（流程图、时序图、甘特图、ER 图等），深色主题适配
  - **嵌入视频**：自定义 Markdown 指令 `::video[https://bilibili.com/...]` 或 `::youtube[video_id]`，渲染为响应式 iframe 播放器，带宇宙主题边框
  - **提示块（Callout/Admonition）**：支持 `> [!NOTE]`、`> [!WARNING]`、`> [!TIP]`、`> [!DANGER]` 语法，渲染为太空主题的提示卡片（不同类型对应不同图标和边框颜色）
  - **脚注**：`[^1]` 脚注语法，渲染为可点击的弹出式注释（悬停显示内容）
  - **任务列表**：`- [ ]` / `- [x]` 渲染为太空主题的复选框样式
  - **表格增强**：表格支持排序（可选），表头采用 HUD 风格样式
- **技术**：remark-math + rehype-katex、mermaid（懒加载）、remark-directive（自定义指令）、remark-gfm
- **产出**：`components/ui/markdown/` Markdown 扩展组件目录；`utils/remarkPlugins.ts` remark/rehype 插件链配置

### 5.4.2 文章元信息展示
- **任务**：在阅读面板顶部展示文章的完整元信息：
  - 头部区域（文章标题下方）：
    - 发布日期（相对时间 + 绝对日期 tooltip，如 "3 天前 · 2026-03-11"）
    - 所属星系（分类）名称——可点击，跳转回对应星系
    - 标签列表——渲染为小型发光标签胶囊，可点击触发标签筛选
    - 字数统计 + 预估阅读时间
    - 阅读量（从统计 API 获取）
  - 底部区域（文章正文结束后）：
    - 作者信息卡片（头像、名称、简介，链接到脉冲星个人简介）
    - 最后更新时间（如与发布时间不同）
    - 版权声明（CC BY-NC-SA 4.0 或自定义）
    - 标签列表（再次展示，方便发现相关内容）
- **技术**：React 组件、dayjs（日期格式化）、统计 API 集成
- **产出**：`components/ui/ArticleMeta.tsx` 文章元信息组件；`components/ui/AuthorCard.tsx` 作者卡片

### 5.5 阅读面板交互
- **任务**：实现文章面板内滚动（自定义滚动条样式）；返回按钮触发反向动画（从微观视界回退到宏观轨道视角）；键盘快捷键支持（ESC 返回、方向键翻页）
- **技术**：React 事件处理、GSAP 反向 timeline
- **产出**：完整的文章进入/阅读/退出交互闭环

### 5.6 文章目录导航 (TOC)
- **任务**：为长文章自动生成侧边目录大纲：
  - 解析 Markdown 标题层级（h2-h4），生成可折叠的树形目录
  - 目录面板采用半透明 HUD 风格，固定在阅读面板左侧
  - 滚动时自动高亮当前所在章节（Intersection Observer）
  - 点击目录项平滑滚动到对应位置
  - 3D 联动（可选）：行星表面划分为对应章节的区域，当前章节区域发光
- **技术**：react-markdown AST 解析、Intersection Observer、CSS sticky 定位
- **产出**：`components/ui/TableOfContents.tsx`，HUD 风格文章目录导航

### 5.7 阅读进度与预计时间
- **任务**：在阅读面板顶部显示文章阅读信息：
  - 预估阅读时间（按中文 400 字/分钟、英文 200 词/分钟计算）
  - 阅读进度条——太空主题的能量条样式（发光渐变），随滚动实时更新
  - 进度百分比数字显示（等宽字体，终端风格）
  - 阅读完成时触发微交互——进度条闪烁 + "探索完成" 提示
- **技术**：Intersection Observer、CSS 自定义进度条、React 状态
- **产出**：`components/ui/ReadingProgress.tsx`，阅读进度指示器

### 5.8 代码沙盒（交互式代码片段）
- **任务**：技术文章中的代码块支持在线运行和编辑：
  - 识别 Markdown 代码块中的 `interactive` 标记（如 ````js interactive`）
  - 嵌入 Sandpack 组件，支持 JavaScript/TypeScript/React 代码实时预览
  - 代码编辑器采用深色太空主题配色（与博客视觉一致）
  - 非交互式代码块保持原有的 `rehype-highlight` 静态高亮
  - 运行结果面板支持 Console 输出和 UI 预览两种模式
- **技术**：Sandpack（@codesandbox/sandpack-react）、CodeMirror（可选）、自定义主题
- **产出**：`components/ui/InteractiveCode.tsx`，交互式代码沙盒组件

### 5.9 上下篇导航
- **任务**：在文章阅读面板底部提供相邻文章的快速跳转：
  - 显示同星系内按发布时间排序的上一篇 / 下一篇文章（标题 + 行星缩略图预览）
  - 点击触发无缝过渡动画：当前行星表面淡出 → 摄像机短距离平移到相邻行星 → 新行星表面大气突入（简化版，省略长距离飞行）
  - 边界处理：第一篇无"上一篇"，最后一篇无"下一篇"，可选跨星系跳转提示
  - 键盘快捷键：`←` 上一篇、`→` 下一篇（与 5.5 的方向键翻页不冲突——翻页仅在文章内容滚动到底时触发切换）
- **技术**：GraphQL 相邻文章查询（`previousPost` / `nextPost`）、GSAP 过渡动画、React 状态
- **产出**：`components/ui/ArticleNavigation.tsx` 上下篇导航组件

### 5.10 图片灯箱
- **任务**：文章内的图片支持点击放大查看：
  - 点击文章中的图片，弹出全屏灯箱覆盖层（深色半透明背景）
  - 支持缩放（鼠标滚轮 / 双指捏合）、拖拽平移查看高清细节
  - 多图场景：同一篇文章的所有图片形成画廊，左右箭头或滑动切换
  - 灯箱底部显示图片描述（Markdown `alt` 文本）和序号（2/5）
  - ESC 或点击背景关闭灯箱
  - 视觉风格：与宇宙主题一致——边框发光、过渡动画采用缩放 + 淡入
- **技术**：React 弹出层、CSS transform（缩放/平移）、触摸手势（hammer.js 或原生 pointer events）
- **产出**：`components/ui/ImageLightbox.tsx` 图片灯箱组件

### 5.11 社交分享
- **任务**：在阅读面板中提供便捷的文章分享能力：
  - 分享按钮栏（固定在阅读面板右侧或底部浮动）：
    - 复制链接——点击后复制文章永久链接到剪贴板，显示"链接已复制"太空主题 toast 提示
    - 分享到 Twitter/X——预填文章标题 + 链接
    - 分享到微信——生成文章链接二维码弹窗（使用 `qrcode` 库生成 SVG）
    - 分享到微博——预填标题 + 链接
    - Web Share API——在支持的设备上（主要是移动端）调用系统原生分享面板
  - 文本选中分享（可选）：用户选中文章中的一段文字时，浮出"分享引用"按钮，生成带引用格式的分享内容
  - 分享追踪（可选）：分享链接附带 `?ref=twitter` 等来源参数，统计 API 记录来源渠道
- **技术**：Web Share API、`navigator.clipboard`、qrcode（SVG 二维码生成）、CSS 浮动栏
- **产出**：`components/ui/ShareBar.tsx` 分享按钮栏；`components/ui/QRCodeModal.tsx` 二维码弹窗
