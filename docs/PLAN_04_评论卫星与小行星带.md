# Phase 6-7: 评论卫星系统与小行星带

> 涵盖评论卫星渲染/交互/发射动画，以及草稿灵感的小行星带系统。

---

## Phase 6: 评论卫星系统

### 6.1 卫星渲染（InstancedMesh 批量渲染）
- **任务**：使用 `THREE.InstancedMesh` 单次 Draw Call 渲染一篇文章的所有评论卫星；每颗卫星由后端返回的 `orbital_params`（轨道半径、离心率、倾角、相位偏移）决定位置；在 `useFrame` 中使用**简化开普勒椭圆轨道**更新公转（不使用正圆匀速 `cos/sin`——正圆轨道看起来像钟表齿轮，缺乏太空感）：
  ```
  // 开普勒方程: M = E - e * sin(E)，Newton-Raphson 迭代 3 次求解 E
  M = time * speed + phaseOffset          // 平均近点角
  E = M                                    // 初始猜测
  for (i = 0; i < 3; i++) E = E - (E - e * sin(E) - M) / (1 - e * cos(E))
  // 椭圆轨道位置
  x = a * (cos(E) - e)
  z = a * sqrt(1 - e*e) * sin(E)
  // 应用轨道倾角旋转
  ```
  - 离心率 e 范围 0.02~0.15（近圆但非正圆），近点时微微加速、远点时减速
  - Newton-Raphson 3 次迭代 CPU 开销极低（< 0.001ms/天体）
- **技术**：Three.js InstancedMesh、useFrame、Matrix4、开普勒方程 Newton-Raphson 迭代
- **产出**：`components/canvas/SatelliteSwarm.tsx`，高性能卫星群渲染

### 6.2 卫星 LOD 与热度可视化
- **任务**：远距离时卫星群退化为粒子光点（Points）；近距离渲染为 InstancedMesh 精细 Mesh。**LOD 切换使用交叉淡入（Dithered Cross-fade）**，不做硬切换（硬切换会导致天体在切换距离处"闪烁跳变"，尤其在摄像机来回移动时反复闪烁）：
  - 在切换距离的 ±15% 范围内设置过渡带
  - 过渡带内同时渲染两个 LOD 级别
  - 使用 Shader 中的 **Dithered Transparency**（棋盘格/噪声透明）实现渐变，无需开启 alpha blend、无排序问题：
    ```glsl
    float dither = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
    if (dither > fadeProgress) discard;  // fadeProgress 0→1 时逐渐消失
    ```
  - 过渡完成后移除旧 LOD 级别的渲染
  - 评论数量极多时（>50）自动形成"行星环"效果——卫星轨道半径收窄为窄带分布
- **技术**：Three.js LOD + Dithered Cross-fade Shader、动态粒子/Mesh 切换
- **产出**：行星热度一目了然——孤零零 vs 壮观行星环；LOD 切换零闪烁

### 6.2.1 评论者身份与程序化头像
- **任务**：为匿名评论者生成独一无二的太空视觉身份：
  - 身份生成：评论者输入昵称（必填）+ 邮箱（选填，用于通知），后端对 `昵称 + IP` 做 SHA-256 哈希生成 `avatar_seed`
  - 程序化头像：基于 `avatar_seed` 生成独特的太空主题 SVG 头像——使用确定性随机算法组合：
    - 基础形状（圆形/六边形/菱形外框）
    - 配色方案（从宇宙配色池中选取 2-3 色）
    - 内部图案（星纹、环纹、网格、星座连线等）
  - 卫星外观联动：每颗评论卫星的颜色和表面纹理由 `avatar_seed` 决定，同一评论者的所有卫星视觉统一
  - 评论者一致性：同一昵称 + 同一 IP 始终生成相同头像和卫星外观，跨文章可识别
  - HUD 展示：卫星悬停 tooltip 和评论详情面板中显示程序化头像 + 昵称
- **技术**：SHA-256 哈希、确定性随机数生成器（seedrandom）、SVG 程序化生成、Three.js 材质 seed 参数
- **产出**：`utils/avatarGenerator.ts` 程序化头像生成器；`components/ui/CosmicAvatar.tsx` 头像组件；卫星材质 seed 联动逻辑

### 6.3 飞船 HUD 评论输入面板
- **任务**：按 Enter 或点击触发，屏幕底部滑出半透明 HUD 面板；等宽终端字体、扫描线背景效果；输入框 + "发射 (Launch)" 按钮；Zustand 管理面板开关状态
- **技术**：React、Tailwind CSS、CSS animation（扫描线）、Zustand
- **产出**：`components/ui/CommentHUD.tsx`，飞船风格评论输入界面

### 6.4 卫星发射动画
- **任务**：点击"发射"后：① HUD 收缩为光束（GSAP scale + opacity 动画）② 光束沿 `CatmullRomCurve3` 曲线从屏幕底部飞向行星轨道（R3F `<Line>` + 发光 Trail）③ 光束到达轨道后凝结为新卫星（缩放弹性动画）
- **技术**：GSAP、Three.js CatmullRomCurve3、自定义 Trail 效果
- **产出**：`animations/satelliteLaunch.ts`，评论发射的完整视觉效果

### 6.4.1 评论乐观更新
- **任务**：实现评论提交的乐观 UI，让用户感知零延迟：
  - 点击"发射"后立即在前端创建临时卫星（半透明 + 呼吸闪烁动画），同时触发发射动画
  - 前端预分配临时轨道参数（简化的角度均分算法），卫星以"幽灵态"出现在轨道上
  - 后端请求成功：用服务端返回的正式 `orbital_params` 替换临时参数，卫星从半透明平滑过渡为实体（opacity 0.5 → 1.0），GSAP 将位置插值到正式轨道坐标
  - 后端请求失败：幽灵态卫星播放消散动画（粒子碎裂扩散 + 淡出），HUD 显示错误提示（"信号中断，发射失败，请重试"）
  - Zustand 状态管理：维护 `pendingComments` 列表，区分临时卫星和正式卫星
- **技术**：Zustand 乐观状态管理、GSAP 过渡动画、Three.js 材质 opacity 动态控制
- **产出**：`hooks/useOptimisticComment.ts` 乐观更新 Hook；临时卫星渲染与状态转换逻辑

### 6.5 卫星详情查看
- **任务**：鼠标悬停卫星时高亮并显示评论者 ID tooltip；点击卫星后摄像机焦距拉近（GSAP zoom），卫星表面展开全息投影显示评论内容；点击空白处回弹恢复
- **技术**：R3F 事件、GSAP、Html 组件
- **产出**：评论查看的完整交互流程

### 6.6 后端轨道分配 API
- **任务**：实现 POST 评论接口：接收评论内容 → 调用**分层轨道环带算法**（见 PLAN_02 §3.4）分配轨道参数 → 存入 DB → 失效 Redis 缓存 → 返回完整卫星数据（含轨道坐标）
  - 新增卫星时采用**自适应轨道再平衡策略**（非全量重算）：
    - 扫描现有环带，找到"最宽空隙"（相邻卫星间角度差最大的位置）
    - 空隙 > 最小安全间距 → 直接插入空隙中点，其他卫星不动
    - 所有环带都满 → 新开一层环带
    - 删除评论时：仅移除该卫星形成空隙，两侧卫星微调 5% 填补，不做大幅重排
    - 保证单次操作最多影响 20% 的卫星位置（稳定性约束）
- **技术**：Go、分层轨道环带算法 + 自适应再平衡（自研）、PostgreSQL、Redis
- **产出**：`/api/comment` GraphQL Mutation，返回包含 orbital_params 的卫星对象

### 6.7 评论回复 / 线程（子卫星系统）
- **任务**：支持对评论进行回复，形成嵌套线程：
  - 数据层：`comments` 表增加 `parent_comment_id` 字段，支持树形结构
  - 3D 可视化：回复评论渲染为"子卫星"——绕父卫星公转的更小球体，轨道半径更小、体积更小
  - 多层回复形成卫星的卫星链（最多支持 3 层嵌套，避免视觉混乱）
  - 点击父卫星时展开显示子卫星群；收起时子卫星合并为光环
- **技术**：Three.js 嵌套 Group、InstancedMesh、递归轨道计算
- **产出**：`components/canvas/SubSatellite.tsx`，子卫星组件；评论线程的完整前后端逻辑

### 6.8 评论表情反应
- **任务**：支持对文章和评论添加 emoji 反应：
  - 预设 6 种太空主题反应：⭐（精彩）、🚀（火箭，赞）、🌍（深度）、☄️（震撼）、🛸（脑洞）、🌑（沉思）
  - 行星表面显示反应统计——高频反应渲染为行星赤道上漂浮的发光符文
  - 卫星（评论）上的反应显示为卫星表面的微光点
  - 后端使用 Redis Sorted Set 高效计数，定期持久化
- **技术**：Redis ZINCRBY、Three.js Sprite/Billboard、React emoji picker
- **产出**：`components/ui/ReactionBar.tsx`，太空主题反应组件；`backend/internal/reaction/` 反应计数模块

### 6.9 评论管理工作流
- **任务**：为管理员提供完整的评论管理能力：
  - 审核模式（可选开启）：新评论默认进入待审核状态，卫星以虚线轮廓 + 低透明度渲染，审核通过后变为实体
  - 管理操作：
    - 通过 / 拒绝（批量操作支持）
    - 置顶评论——置顶的卫星体积增大 1.5 倍、轨道最近、持续发光高亮，HUD 标注"置顶"标签
    - 标记为垃圾——移入垃圾箱（软删除），卫星消散动画
    - 删除——从 3D 场景中移除，触发轨道重分配（其他卫星平滑调整位置填补空缺）
  - 管理后台评论列表：按文章/时间/状态筛选，批量审核，查看评论者 IP / UA 信息
  - 评论统计：每篇文章的评论数趋势图、垃圾评论拦截率
- **技术**：Go 管理 API（GraphQL Mutation）、前端管理 UI、Zustand 评论状态管理、GSAP 轨道重分配动画
- **产出**：`backend/internal/comment/moderation.go` 审核逻辑；管理后台评论管理页面；3D 场景中审核态卫星的视觉区分

### 6.10 评论排序与筛选
- **任务**：为用户提供评论的多维度浏览方式：
  - 排序模式（HUD 中切换）：
    - 时间序（默认）：卫星按发布时间排列，最新的轨道最外层
    - 热度序：按回复数 + 反应数排序，最热的卫星最大最亮、轨道最近
    - 星座序：按评论线程分组，同线程卫星聚集成簇
  - 切换排序时的过渡动画：所有卫星同时平滑移动到新的轨道位置（GSAP `stagger` 动画，波纹式重排）
  - 评论数量指示：HUD 显示当前行星的评论总数和新增数（自上次访问以来）
  - 筛选（可选）：只看某个评论者的卫星，其他灰显
- **技术**：Zustand 排序/筛选状态、GSAP stagger 动画、后端排序查询支持
- **产出**：`components/ui/CommentSortControl.tsx` 排序切换组件；卫星重排过渡动画

### 6.11 评论通知
- **任务**：当评论被回复时通知原评论者：
  - 邮件通知（如果评论者留了邮箱）：发送回复通知邮件，包含原评论内容摘要、回复内容、文章链接；邮件底部提供一键取消通知的链接
  - WebSocket 实时通知（如果评论者仍在线）：浏览器右上角弹出太空主题通知气泡——"你在《xxx》的评论收到了新回复"，点击跳转到对应卫星
  - 通知频率控制：同一评论的多条回复在 5 分钟内合并为一封邮件，避免轰炸
  - 隐私保护：邮箱仅用于通知，不公开展示，存储时哈希处理
- **技术**：Go SMTP（复用 newsletter 模块）、WebSocket 事件推送、Redis 通知合并队列
- **产出**：`backend/internal/notification/` 通知模块；前端通知气泡组件

### 6.12 反垃圾评论防护
- **任务**：实现多层防御的反垃圾评论机制（不使用传统 CAPTCHA；不依赖蜜罐字段——现代 headless browser 爬虫不会填写隐藏字段，蜜罐已失效；不依赖提交时间检测——GPT 驱动的垃圾机器人会模拟人类等待时间）：
  - **第一层：前端 Proof of Work（PoW）**——提交评论前要求浏览器解一个小型 SHA-256 哈希挑战（找到 nonce 使 `SHA256(comment_id + nonce)` 前 18 位为 0），正常设备 ~200ms 完成对用户无感，但大规模垃圾发送者成本 ×1000。参考实现：[altcha.org](https://altcha.org)（开源 PoW 验证码）
  - **第二层：浏览器行为分析**——记录用户从打开页面到提交的鼠标轨迹熵、键盘输入节奏、滚动行为，前端计算 `behavior_score`（机器人行为熵极低：完美直线鼠标、均匀键入间隔），低于阈值拒绝提交
  - **第三层：后端内容分析**——
    - 评论内容与文章的 TF-IDF 交集相关度检测（完全无关的垃圾评论过滤）
    - 重复内容检测（SimHash 指纹去重——同一内容在不同文章下批量发布）
    - 可配置的垃圾链接域名黑名单
  - **第四层：频率限制**——同 IP 滑动窗口限流，每分钟最多 3 条评论
  - 太空主题挑战（可选保留）——简单的宇宙知识问题，融入沉浸体验
- **技术**：SHA-256 PoW 挑战、行为熵分析、TF-IDF / SimHash、Redis 滑动窗口限流
- **产出**：`backend/internal/antispam/` 反垃圾模块（PoW 验证 + 内容分析）；`utils/behaviorAnalyzer.ts` 前端行为分析；`utils/powChallenge.ts` PoW 挑战求解

---

## Phase 7: 小行星带 —— 草稿与灵感碎片

### 7.1 小行星带粒子系统
- **任务**：使用 `InstancedMesh` 渲染最多 5000 块不规则小行星；每块小行星使用低多边形 `IcosahedronGeometry`（随机变形顶点）；位置分布在星系边缘的环带区域内，带随机漂移
- **技术**：Three.js InstancedMesh、IcosahedronGeometry 变形、useFrame 漂移动画
- **产出**：`components/canvas/AsteroidBelt.tsx`，混沌漂浮的小行星带

### 7.1.1 小行星视觉差异化
- **任务**：让每块草稿小行星的外观反映其内容特征，一眼看出差异：
  - 体积 → 内容长度：字数越多的草稿，小行星体积越大（线性映射，最小 0.5x，最大 3x 基础尺寸）
  - 颜色 → 创建时间：新鲜草稿偏亮偏暖（橙/黄，如刚凝聚的炽热岩石），年久草稿偏暗偏冷（灰/蓝，如冷却的陨石）
  - 形状粗糙度 → 编辑次数：未经编辑的草稿顶点偏移大（棱角分明的粗糙碎片），多次编辑的草稿更光滑（趋近球体，表示已打磨）
  - 发光标记 → 被选中/收藏：博主在管理后台标记为"重要"的草稿带持续发光描边（emissive rim light）
  - InstancedMesh 颜色：通过 `instanceColor` attribute 实现逐实例颜色，无需额外 Draw Call
- **技术**：Three.js InstancedMesh instanceColor、IcosahedronGeometry 顶点变形参数化、GLSL 颜色映射
- **产出**：小行星外观与内容元数据的程序化映射逻辑

### 7.2 小行星交互（灵感查看）
- **任务**：点击小行星，无需复杂加载动画——直接弹出轻量 HUD 快讯面板（类似 toast），显示灵感纯文本内容；支持快速翻阅（左右箭头切换相邻小行星）
- **技术**：R3F 事件、轻量 UI 弹窗
- **产出**：`components/ui/InspirationToast.tsx`，快捷灵感查看

### 7.3 引力坍缩动效（草稿成文）
- **任务**：管理后台选中多块小行星并点击"成文"后触发坍缩动画：① 选中的小行星高亮标记 ② GSAP 将它们的 InstancedMesh Matrix 向中心点插值移动 ③ 碰撞瞬间触发粒子爆炸（`ParticleSystem`，强光 + 碎片飞溅）④ 爆炸消散后原地生成一颗新 `<Planet>` 组件
- **技术**：GSAP Matrix4 插值、Three.js 粒子系统、动态组件挂载
- **产出**：`animations/gravitationalCollapse.ts`，壮观的草稿聚合成文动效

### 7.4 草稿 CRUD 后端
- **任务**：实现草稿/灵感的 CRUD API；草稿类型为 `ASTEROID`；支持标记多个草稿并聚合为一篇文章（类型从 ASTEROID 变为 PLANET，合并内容，生成物理参数）
- **技术**：Go、GraphQL Mutation、PostgreSQL
- **产出**：草稿管理的完整后端逻辑

### 7.5 灵感快速捕获
- **任务**：为博主提供随时随地快速记录灵感的入口：
  - 全局快捷键：在博客任何页面按 `Ctrl+Shift+I`（Inspiration），弹出极简的灵感输入浮窗——单个文本框 + "投射 (Cast)" 按钮，输入后一键保存为 ASTEROID 类型
  - 3D 场景内快捷操作：在小行星带区域双击空白处，就地弹出输入框，保存后新小行星从输入位置"凝聚"出现（缩放弹入动画）
  - 移动端适配：管理后台提供 `/admin/quick-note` 简洁页面，可添加到手机桌面，打开即是输入框（PWA 模式下支持离线暂存，联网后同步）
  - RESTful 快捷端点：`POST /api/v1/quick-note`（API Key 认证），一个 `content` 字段即可，适配 iOS Shortcuts / Telegram Bot / Alfred Workflow 等外部工具
  - 自动元数据：创建时间自动记录，后端根据内容长度自动生成小行星的物理参数（体积、颜色 seed）
- **技术**：React 全局快捷键监听、PWA 离线存储（IndexedDB）、RESTful API、GSAP 凝聚动画
- **产出**：`components/ui/QuickCapture.tsx` 快速输入浮窗；`app/admin/quick-note/page.tsx` 移动端快捷页面；`/api/v1/quick-note` 端点

### 7.6 草稿就地编辑
- **任务**：支持在 3D 场景中直接编辑草稿内容，无需跳转管理后台：
  - 点击小行星弹出查看 toast 后，toast 面板底部显示"编辑"按钮（仅管理员可见，通过 JWT 状态判断）
  - 点击编辑后 toast 扩展为编辑面板——文本框可编辑、支持基础 Markdown 语法、实时字数统计
  - 保存后小行星外观实时更新（体积随字数变化的缩放动画）
  - 删除按钮：点击后小行星播放碎裂消散动画，从场景中移除
  - 自动保存：编辑过程中每 10 秒自动保存草稿（debounced API 调用），防止内容丢失
- **技术**：R3F Html 组件、React 可编辑文本框、Zustand 编辑状态、debounced API 调用
- **产出**：`components/ui/AsteroidEditor.tsx` 草稿就地编辑组件

### 7.7 草稿搜索与分类
- **任务**：为管理员提供草稿的组织和检索能力：
  - 搜索：HUD 小行星带区域顶部提供搜索栏，输入关键词后匹配的小行星高亮闪烁，未匹配的降低透明度（复用搜索可视化逻辑）
  - 预分类标签：草稿可打 1-3 个预分类标签（如"技术"、"随想"、"待研究"），标签在小行星表面显示为不同颜色的光环
  - 时间排序：按创建时间排列——最新的小行星靠近小行星带外沿，最老的靠近内沿，形成自然的时间地层
  - 筛选面板：管理后台的草稿列表支持按标签/时间范围/内容长度筛选，结果与 3D 场景联动
  - 统计信息：HUD 显示草稿总数、本周新增数、最老未处理草稿的年龄
- **技术**：前端关键词过滤（小规模数据量无需后端搜索）、Zustand 筛选状态、Three.js instanceColor 动态更新
- **产出**：`components/ui/AsteroidSearch.tsx` 草稿搜索组件；草稿分类标签逻辑

---

## Phase 6-7 补充: 粒子特效性能与批量操作帧分摊

### 6.13 粒子特效对象池化

- **任务**：将评论卫星发射、引力坍缩爆炸等粒子特效接入 Phase 1 §1.19 建立的对象池，消除运行时的对象创建/销毁开销：
  - **卫星发射 Trail 效果**（§6.4）：
    - 发射光束的 Trail 由 20-50 个粒子组成，发射完成后回收
    - 使用 InstancedMesh 粒子池，发射时 `acquire(50)` 获取粒子并沿 CatmullRom 曲线布置
    - Trail 淡出完成后 `release()` 归还池中
    - 峰值估算：同时最多 3 条 Trail 活跃（3 人同时发射评论） → 池容量预设 200 粒子
  - **引力坍缩爆炸**（§7.3）：
    - 碰撞瞬间释放 100-300 个碎片粒子，径向飞散 + 衰减
    - 粒子池容量预设 500（考虑爆炸 + Trail 可能同时存在）
    - 碎片粒子生命周期 1.5 秒，通过 `useFrame` 中的计数器管理自动回收
  - **粒子池全局管理**：
    ```tsx
    // 全局单例粒子池（Zustand 管理）
    const useParticlePool = create(() => ({
      trailPool: new InstancedParticlePool(200),
      explosionPool: new InstancedParticlePool(500),
    }))
    ```
  - **性能对比**：
    - 无池化：每次发射创建 50 个 Object3D → GC 每 10 次发射触发一次 ~5ms 暂停
    - 池化后：零 GC 压力，帧率完全稳定
- **技术**：Phase 1 §1.19 的 `InstancedParticlePool`、InstancedMesh Matrix4 变换、生命周期计数器
- **产出**：卫星发射和坍缩爆炸特效接入对象池；粒子池容量配置

### 6.14 批量卫星操作帧分摊

- **任务**：将涉及大量卫星的批量操作分摊到多帧执行，防止单帧计算量过大导致帧率骤降：
  - **问题场景**：
    | 操作 | 同时影响天体数 | 单帧不分摊的耗时（估算） |
    |------|--------------|----------------------|
    | 评论排序切换（§6.10） | 50-200 颗卫星 | 5-15ms（轨道重算 + Matrix 更新） |
    | 搜索结果高亮（PLAN_03 §4.10） | 50+ 个天体 | 3-10ms（emissive 材质变更） |
    | WebSocket 断线补偿动画（PLAN_06 §11.3.1） | 积压 N 条 | N × 2s 动画排队 |
    | 管理员批量审核评论通过（§6.9） | 10-50 颗卫星 | 3-8ms（材质切换 + 轨道调整） |
  - **帧分摊策略**：
    ```tsx
    // 每帧最多处理 BATCH_SIZE 个对象的更新
    const BATCH_SIZE = 8
    const pendingUpdates = useRef<UpdateTask[]>([])

    useFrame((_, delta) => {
      const batch = pendingUpdates.current.splice(0, BATCH_SIZE)
      batch.forEach(task => task.execute(delta))
    })

    // 触发批量操作时，将所有更新推入队列
    function reorderSatellites(newOrder: OrbitalParams[]) {
      newOrder.forEach((params, i) => {
        pendingUpdates.current.push({
          execute: (delta) => {
            // Lerp 当前位置到目标位置（而非瞬移）
            satellites[i].position.lerp(params.position, 0.15 * delta * 60)
          }
        })
      })
    }
    ```
  - **视觉效果**：分帧执行不会让动画变慢，因为每个对象的位移使用 Lerp 逐帧逼近目标，用户看到的是波纹式展开的平滑过渡
  - **与 GSAP stagger 配合**：GSAP 的 `stagger` 属性本身就实现了时间分摊（每个对象延迟 0.02s 开始），但 stagger 仍在同一帧计算所有轨道目标——应将**目标计算**也分帧
- **技术**：useFrame 分帧队列、Lerp 逐帧逼近、GSAP stagger
- **产出**：`hooks/useBatchUpdate.ts` 分帧批量更新 Hook；卫星排序/搜索高亮的分帧执行逻辑

### 7.8 小行星带 InstancedMesh 性能防护

- **任务**：针对 5000 块小行星的 InstancedMesh 渲染，建立额外的性能防护措施：
  - **实例数量自适应**：根据 Phase 1 §1.14 自适应画质等级动态调整小行星实例数：
    | 画质等级 | 小行星实例数 | 细节 |
    |----------|-------------|------|
    | 高 | 5000 | 每块独立顶点变形 + instanceColor |
    | 中 | 2000 | 简化顶点变形 |
    | 低 | 500 | 仅颜色差异，统一几何体 |
    | 极低 | 0（2D 降级） | 不渲染 |
  - **instanceMatrix 更新优化**：
    - 5000 个 Matrix4 每帧全量更新 = 5000 × 64 bytes = 320KB 上传 GPU → 有性能压力
    - **分区更新**：将小行星按空间分区（8 个区域），每帧只更新摄像机附近 2 个区域的 Matrix（漂移动画），远距离区域每 4 帧更新一次
    - 设置 `instanceMatrix.updateRange` 局部上传（仅上传变化的矩阵段，而非全量）：
      ```tsx
      instancedMesh.instanceMatrix.updateRange.offset = startIndex * 16
      instancedMesh.instanceMatrix.updateRange.count = batchCount * 16
      instancedMesh.instanceMatrix.needsUpdate = true
      ```
  - **视锥外小行星冻结**：小行星带区域不在视锥内时，完全跳过 `useFrame` 中的矩阵更新（通过 `Frustum.containsPoint` 判断区域中心点）
- **技术**：InstancedMesh `updateRange` 局部更新、Frustum 检测、自适应画质联动
- **产出**：`components/canvas/AsteroidBelt.tsx` 中的分区更新和自适应实例数逻辑
