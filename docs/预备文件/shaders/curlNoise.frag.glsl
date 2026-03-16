// CyberGeek Cosmic Engine — Curl Noise Nebula Particle Field
//
// 用于星系星云粒子的速度场着色器。
// 包含完整的 3D Simplex Noise 实现和 Curl Noise 计算函数。
// Curl Noise 输出无散度 (divergence-free) 的速度场，
// 粒子在此场中运动不会聚集或发散，天然适合流体/星云模拟。
//
// ═══════════════════════════════════════════════════════════
// 本文件可作为两种用途:
//
// 【用途 A】独立 Fragment Shader — 可视化速度场:
//   new THREE.ShaderMaterial({
//     uniforms: {
//       u_time:       { value: 0.0 },
//       u_resolution: { value: new THREE.Vector2(w, h) },
//       u_noiseScale: { value: 1.5 },
//       u_noiseSpeed: { value: 0.3 }
//     },
//     fragmentShader: curlNoiseSource
//   });
//
// 【用途 B】在 Vertex Shader 中 include 使用:
//   在 vertex shader 中使用 curlNoise() 函数驱动粒子运动:
//
//   // --- vertex shader 示例 ---
//   uniform float u_time;
//   uniform float u_noiseScale;
//   attribute vec3 aBasePosition;   // 粒子初始位置
//
//   // 将本文件中 snoise() 和 curlNoise() 函数复制到 vertex shader
//   // 或使用 #include 机制 (如 glslify / Three.js onBeforeCompile)
//
//   void main() {
//     vec3 velocity = curlNoise(aBasePosition * u_noiseScale + u_time * 0.1);
//     vec3 displaced = aBasePosition + velocity * 0.5;
//     gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
//     gl_PointSize = 2.0;
//   }
// ═══════════════════════════════════════════════════════════

precision highp float;

uniform float u_time;
uniform vec2  u_resolution;
uniform float u_noiseScale;
uniform float u_noiseSpeed;

varying vec2 vUv;

// ════════════════════════════════════════════
//  3D Simplex Noise
//  基于 Ashima Arts (Stefan Gustavson) 实现
// ════════════════════════════════════════════

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 10.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    // 第一步：单形角坐标
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    // 排列顺序
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    // 排列
    i = mod289(i);
    vec4 p = permute(
        permute(
            permute(
                i.z + vec4(0.0, i1.z, i2.z, 1.0)
            ) + i.y + vec4(0.0, i1.y, i2.y, 1.0)
        ) + i.x + vec4(0.0, i1.x, i2.x, 1.0)
    );

    // 梯度：映射到 7x7 点阵上的 49 个方向
    float n_ = 0.142857142857; // 1/7
    vec3  ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    // 归一化梯度
    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    // 混合贡献
    vec4 m = max(0.5 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 105.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

// ════════════════════════════════════════════
//  Curl Noise
//  对 3D Simplex Noise 求旋度 (curl)，
//  得到无散度的速度场 (∇·v = 0)
// ════════════════════════════════════════════

vec3 curlNoise(vec3 p) {
    // 有限差分步长
    const float e = 0.0001;

    // 使用三个不同偏移的 noise 分量构造势场，然后求旋度
    // 势场 F = (snoise(p + offset_a), snoise(p + offset_b), snoise(p + offset_c))
    // curl(F) = (dFz/dy - dFy/dz, dFx/dz - dFz/dx, dFy/dx - dFx/dy)

    // 为避免三个分量相关，使用不同的偏移
    vec3 offsetA = vec3(0.0, 0.0, 0.0);
    vec3 offsetB = vec3(31.416, 17.321, 7.654);
    vec3 offsetC = vec3(63.823, 41.159, 23.987);

    // dFz/dy
    float dFz_dy = snoise(p + offsetC + vec3(0.0, e, 0.0)) - snoise(p + offsetC - vec3(0.0, e, 0.0));
    // dFy/dz
    float dFy_dz = snoise(p + offsetB + vec3(0.0, 0.0, e)) - snoise(p + offsetB - vec3(0.0, 0.0, e));
    // dFx/dz
    float dFx_dz = snoise(p + offsetA + vec3(0.0, 0.0, e)) - snoise(p + offsetA - vec3(0.0, 0.0, e));
    // dFz/dx
    float dFz_dx = snoise(p + offsetC + vec3(e, 0.0, 0.0)) - snoise(p + offsetC - vec3(e, 0.0, 0.0));
    // dFy/dx
    float dFy_dx = snoise(p + offsetB + vec3(e, 0.0, 0.0)) - snoise(p + offsetB - vec3(e, 0.0, 0.0));
    // dFx/dy
    float dFx_dy = snoise(p + offsetA + vec3(0.0, e, 0.0)) - snoise(p + offsetA - vec3(0.0, e, 0.0));

    // 旋度
    return vec3(
        dFz_dy - dFy_dz,
        dFx_dz - dFz_dx,
        dFy_dx - dFx_dy
    ) / (2.0 * e);
}

// ════════════════════════════════════════════
//  main() — 速度场可视化（调试/预览用）
//  将 curl noise 的 xyz 分量映射为 RGB
// ════════════════════════════════════════════

void main() {
    vec2 uv = vUv;

    // 构造 3D 采样点：xy 来自 UV，z 来自时间
    vec3 samplePos = vec3(uv * u_noiseScale, u_time * u_noiseSpeed);

    // 计算 curl noise 速度场
    vec3 velocity = curlNoise(samplePos);

    // 可视化：将 [-1,1] 范围的速度映射到 [0,1] 颜色
    vec3 color = velocity * 0.5 + 0.5;

    gl_FragColor = vec4(color, 1.0);
}
