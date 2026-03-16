# CyberGeek 宇宙博客 — 测试策略

> 技术栈：Next.js 15 + React + Three.js/R3F + TypeScript | Go 1.24 + Fiber + sqlc + gqlgen | PostgreSQL 16 + Redis Stack

---

## 1. 测试分层金字塔

```
        ┌──────────┐
        │   E2E    │  10%  关键用户流程
        │ Playwright│
       ┌┴──────────┴┐
       │  集成测试   │  20%  API 端点、数据库操作、Redis 操作
       │ testcontainers│
      ┌┴────────────┴┐
      │   单元测试    │  70%  纯函数、工具类、算法
      │ Vitest / Go  │
      └──────────────┘
```

**原则**：越底层的测试越多、越快、越稳定；越顶层的测试越少、越慢、但覆盖端到端信心。

---

## 2. 前端测试

### 2.1 单元测试 (Vitest)

#### 工具函数测试

| 模块 | 重点用例 |
|---|---|
| `kepler.ts` | `solveKepler` 收敛性（离心率 0–0.99）、`ellipsePosition` 边界角度、`computeOrbitalPosition` 输出一致性 |
| `crypto.ts` | `decryptArticle` 正确密码解密、错误密码返回失败、空密文处理 |
| `mathHelpers.ts` | 数值精度、边界值（NaN / Infinity / 负数） |

#### Zustand Store 测试

- **cosmicStore**: 天体数据加载、选中行星切换、轨道状态变更
- **uiStore**: 面板开关、画质等级切换、移动端模式标志
- **filterStore**: 分类筛选、标签组合过滤、搜索关键词匹配

测试方式：直接调用 store action，断言 state 变更，不挂载 React 组件。

#### React 组件测试 (React Testing Library)

- 仅测试 **非 3D** 的 UI 组件（文章卡片、评论区、搜索栏、导航栏等）
- 使用 `@testing-library/react` + `@testing-library/user-event`
- Mock 掉所有 Three.js / R3F 依赖

#### i18n 多语言测试

- 验证 `zh-CN`、`en` 两套语言包的 key 完整性（无遗漏）
- 对关键组件分别渲染中英文，断言文本正确输出

### 2.2 3D / Shader 测试策略

Three.js / R3F 组件无法用传统 DOM 单元测试覆盖，采用以下替代方案：

#### 视觉快照 (Storybook + Chromatic)

- 为每个 3D 场景组件编写 Storybook Story
- 使用 Chromatic 或 Percy 进行视觉回归对比
- 关注：星球材质、大气效果、后处理管线输出

#### Shader 测试

- 在 [Shadertoy](https://www.shadertoy.com/) 上建立对照原型
- 修改 ShaderMaterial 后，手动与 Shadertoy 原型对比输出
- 记录每个 Shader 的 Shadertoy 对照链接于代码注释中

#### 性能回归

- **Lighthouse CI**: 每次 PR 运行，监控 Performance Score 不低于基线
- **自定义 FPS 基准脚本**: 在固定场景（100 颗行星 + 后处理开启）下采集 60 秒平均 FPS

#### GPU 内存泄漏回归

- 在 E2E 测试中，操作前后对比 `renderer.info.memory.geometries` 和 `renderer.info.memory.textures`
- 浏览 10 篇文章后，内存指标不应持续增长

### 2.3 E2E 测试 (Playwright)

#### 关键用户流程

| # | 流程 | 验证要点 |
|---|---|---|
| 1 | 首页加载 → 星系可见 → 点击行星 → 大气突入 → 文章阅读 → ESC 返回 | Canvas 渲染、路由切换、动画完成、返回状态恢复 |
| 2 | 评论输入 → PoW 求解 → 提交 → 卫星出现 | PoW 计算完成时间 < 5s、评论持久化、3D 卫星生成 |
| 3 | 搜索 → 结果高亮 → 点击跳转 | 搜索响应时间、高亮准确性、目标页面加载 |
| 4 | 管理后台登录（TOTP）→ 创建文章 → 前台可见 | TOTP 验证、文章保存、前台数据同步 |
| 5 | 黑洞解密流程（正确密码 / 错误密码） | 正确密码解密展示、错误密码友好提示、重试机制 |

#### 移动端 E2E

- 测试 2D 降级视图的核心流程（文章浏览、评论、搜索）
- 使用 Playwright 的移动端 viewport 模拟（iPhone 14, Galaxy S23）
- 验证触摸手势交互（滑动、长按）

#### 性能 E2E

- 浏览 10 篇文章后，`renderer.info.memory` 各项指标不持续增长
- 页面切换动画帧率不低于 30 FPS

---

## 3. 后端测试

### 3.1 单元测试 (Go testing)

| 包 | 测试重点 |
|---|---|
| `physics/` | 轨道分配算法正确性、美学映射（色相/亮度/尺寸）、布局稳定性（相同输入 → 相同输出） |
| `relation/` | Jaccard 系数边界（空集、全集、单元素）、关联度计算精度 |
| `antispam/` | PoW 验证（合法/非法 nonce）、SimHash 近似检测（相似/不相似文本） |
| `auth/` | JWT 生成/验证/过期/篡改、TOTP 验证（当前窗口 ± 1） |
| `crypto/` | 加解密一致性（加密后解密 = 原文）、不同密钥隔离性 |

**要求**：

- 使用表驱动测试 (`[]struct{ name, input, want }`)
- 所有纯函数测试必须可并行运行 (`t.Parallel()`)

### 3.2 集成测试

#### 数据库 (testcontainers-go)

- 启动临时 PostgreSQL 16 + Redis Stack 容器
- 执行完整 migration 后运行 sqlc 生成的查询测试
- 测试事务回滚、并发写入冲突、索引命中

#### GraphQL

- 测试 resolver 的完整查询链路（含 DataLoader 批量加载）
- 验证 N+1 查询已消除（检查 SQL 执行次数）
- 测试 mutation 的输入校验与错误码

#### REST API

- 表驱动测试所有端点：正常请求、缺少参数、非法输入、未授权访问
- 验证 HTTP 状态码、响应 JSON 结构、错误消息

#### WebSocket

- 测试连接建立与鉴权
- 消息收发（单播 / 广播）
- 房间管理（加入 / 离开 / 房间销毁）
- 异常断开后的资源清理

### 3.3 基准测试 (Go benchmark)

```go
func BenchmarkFibonacciSphereToOrbitalBands(b *testing.B) { ... }
func BenchmarkSolveKeplerNR3(b *testing.B)                 { ... }
func BenchmarkSpatialIndex10000Bodies(b *testing.B)         { ... }
```

| 基准项 | 说明 |
|---|---|
| 斐波那契球面 → 分层轨道环带 | 算法性能对比，验证优化效果 |
| 开普勒方程求解 (Newton-Raphson 3 次迭代) | 单次求解耗时，确保 < 1μs |
| 10000 天体空间索引查询 | 范围查询与最近邻查询的吞吐量 |

---

## 4. CI/CD 集成 (GitHub Actions)

### PR 触发 (每次 Push / PR)

```yaml
jobs:
  lint:        # ESLint + golangci-lint
  unit-test:   # Vitest + Go test -race
  build:       # Next.js build + Go build
  lighthouse:  # Lighthouse CI (Performance ≥ 80)
  bundle-size: # 对比 main 分支的 bundle 大小变化
```

### main 合并

```yaml
jobs:
  full-test:   # 全量单元测试 + 集成测试
  e2e:         # Playwright E2E（含移动端）
  deploy:      # 自动部署到 Staging 环境
```

### 安全扫描

- `npm audit` — 前端依赖漏洞扫描
- `govulncheck` — Go 依赖漏洞扫描
- 扫描结果为 Critical / High 时阻断合并

---

## 5. 性能基准与预算

| 指标 | 目标值 | 测量方式 |
|---|---|---|
| 首屏 LCP | < 2.5s | Lighthouse CI |
| FPS（高画质） | ≥ 55 | 自定义基准脚本（100 行星场景） |
| FPS（中画质） | ≥ 50 | 自定义基准脚本（100 行星场景） |
| 首屏 JS (gzip) | < 200KB | `next build` 输出分析 |
| 3D 引擎 chunk (gzip) | < 500KB | `next build` 输出分析 |
| API P95 响应时间 | < 100ms | Go benchmark + Staging 监控 |

**超标处理**：任一指标超出预算时 CI 报红，需在 PR 中说明原因或优化后重新提交。

---

## 6. 测试文件命名规范

| 类别 | 路径模式 | 示例 |
|---|---|---|
| 前端单元测试 | `src/**/*.test.ts` / `src/**/*.spec.ts` | `src/utils/kepler.test.ts` |
| 后端单元测试 | `**/*_test.go` | `internal/physics/orbital_test.go` |
| E2E 测试 | `tests/e2e/*.spec.ts` | `tests/e2e/article-flow.spec.ts` |
| 性能测试 | `tests/perf/*.bench.ts` | `tests/perf/fps-regression.bench.ts` |
| Go 基准测试 | `**/*_test.go` (含 `Benchmark` 函数) | `internal/physics/orbital_test.go` |
| Storybook | `src/**/*.stories.tsx` | `src/components/Planet.stories.tsx` |

---

## 附录：测试工具版本锁定

| 工具 | 版本 |
|---|---|
| Vitest | ^3.x |
| Playwright | ^1.50 |
| React Testing Library | ^16.x |
| testcontainers-go | ^0.36 |
| Lighthouse CI | ^0.15 |
| Storybook | ^8.x |
