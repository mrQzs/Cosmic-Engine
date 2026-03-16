// CyberGeek Cosmic Engine — Voronoi Micro Dimension
//
// 降维微观视界：行星表面过渡为发光的泰森多边形细胞网格纹理。
//
// 用法 (Three.js ShaderMaterial):
//   new THREE.ShaderMaterial({
//     uniforms: {
//       u_time:         { value: 0.0 },
//       u_resolution:   { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
//       u_cellScale:    { value: 8.0 },
//       u_glowColor:    { value: new THREE.Color(0x00ffcc) },
//       u_fadeProgress:  { value: 0.0 }   // 0 = 宏观纹理, 1 = 微观 Voronoi
//     },
//     fragmentShader: voronoiMicroSource,
//     // vertexShader: 使用默认或自定义 vertex shader，需传出 vUv
//   });

precision highp float;

uniform float u_time;
uniform vec2  u_resolution;
uniform float u_cellScale;
uniform vec3  u_glowColor;
uniform float u_fadeProgress;

varying vec2 vUv;

// ---- 伪随机 hash（iq 经典方法） ----
vec2 hash2(vec2 p) {
    p = vec2(
        dot(p, vec2(127.1, 311.7)),
        dot(p, vec2(269.5, 183.3))
    );
    return fract(sin(p) * 43758.5453123);
}

// ---- 2D Voronoi（返回到最近边界的距离和到最近种子点的距离） ----
// F1 = 到最近种子点距离, edge = 到最近细胞壁距离
void voronoi(vec2 uv, out float f1, out float edge) {
    vec2 iuv = floor(uv);
    vec2 fuv = fract(uv);

    // 第一遍：找最近种子点
    vec2 nearestOffset = vec2(0.0);
    float minDist = 8.0;

    for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
            vec2 neighbor = vec2(float(x), float(y));
            vec2 point = hash2(iuv + neighbor);
            // 动态种子点 —— 微弱的脉动运动
            point = 0.5 + 0.5 * sin(u_time * 0.6 + 6.2831 * point);
            vec2 diff = neighbor + point - fuv;
            float d = dot(diff, diff);
            if (d < minDist) {
                minDist = d;
                nearestOffset = diff;
            }
        }
    }
    f1 = sqrt(minDist);

    // 第二遍：计算到 Voronoi 边界的距离
    edge = 8.0;
    for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
            vec2 neighbor = vec2(float(x), float(y));
            vec2 point = hash2(iuv + neighbor);
            point = 0.5 + 0.5 * sin(u_time * 0.6 + 6.2831 * point);
            vec2 diff = neighbor + point - fuv;
            // 跳过最近种子点自身
            if (dot(diff - nearestOffset, diff - nearestOffset) > 0.0001) {
                // 到两种子点中垂面的距离
                float d = dot(0.5 * (nearestOffset + diff), normalize(diff - nearestOffset));
                edge = min(edge, d);
            }
        }
    }
}

// ---- 宏观纹理占位（简单的程序化岩石纹理） ----
vec3 macroTexture(vec2 uv) {
    float n = fract(sin(dot(uv * 5.0, vec2(12.9898, 78.233))) * 43758.5453);
    float grain = mix(0.15, 0.35, n);
    return vec3(grain * 0.8, grain * 0.6, grain * 0.4);
}

void main() {
    vec2 uv = vUv * u_cellScale;

    float f1, edge;
    voronoi(uv, f1, edge);

    // 细胞壁发光：边界越近越亮
    float wallGlow = 1.0 - smoothstep(0.0, 0.08, edge);

    // 细胞内部微弱脉动动画
    float pulse = 0.5 + 0.5 * sin(u_time * 2.0 + f1 * 12.0);
    float cellBrightness = 0.03 + 0.04 * pulse;

    // 微观 Voronoi 纹理颜色
    vec3 microColor = u_glowColor * wallGlow + vec3(cellBrightness);

    // 宏观纹理
    vec3 macroColor = macroTexture(vUv);

    // 基于 u_fadeProgress 在宏观和微观之间过渡
    float t = smoothstep(0.0, 1.0, u_fadeProgress);
    vec3 finalColor = mix(macroColor, microColor, t);

    gl_FragColor = vec4(finalColor, 1.0);
}
