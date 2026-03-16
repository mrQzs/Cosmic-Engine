// CyberGeek Cosmic Engine — Black Hole Gravitational Lensing
//
// 简化施瓦西度规光线弯曲 + 吸积盘 Raymarching。
// 光线在黑洞引力场中弯曲，扭曲背景星空 (envMap)，
// 并在 Schwarzschild 半径 ×1.5~3 范围内渲染旋转吸积盘。
//
// 用法 (Three.js ShaderMaterial):
//   new THREE.ShaderMaterial({
//     uniforms: {
//       u_time:               { value: 0.0 },
//       u_resolution:         { value: new THREE.Vector2(w, h) },
//       u_schwarzschildRadius:{ value: 0.15 },
//       u_accretionColor:     { value: new THREE.Color(0xff6622) },
//       u_maxSteps:           { value: 64 },     // 低=32, 中=64, 高=128
//       u_envMap:             { value: cubeTexture }
//     },
//     fragmentShader: blackHoleSource,
//     // vertexShader: 全屏四边形 vertex shader，传出 vUv
//   });

precision highp float;

uniform float      u_time;
uniform vec2       u_resolution;
uniform float      u_schwarzschildRadius;
uniform vec3       u_accretionColor;
uniform int        u_maxSteps;
uniform samplerCube u_envMap;

varying vec2 vUv;

// ---- 常量 ----
const float PI = 3.14159265359;

// ---- 吸积盘噪声（简单 hash） ----
float hash(float n) {
    return fract(sin(n) * 43758.5453123);
}

float noise1D(float p) {
    float i = floor(p);
    float f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(hash(i), hash(i + 1.0), f);
}

void main() {
    // 屏幕坐标归一化到 [-1, 1]，保持宽高比
    vec2 uv = (vUv - 0.5) * 2.0;
    float aspect = u_resolution.x / u_resolution.y;
    uv.x *= aspect;

    // ---- 光线初始化 ----
    // 从相机向屏幕平面发射光线
    vec3 rayOrigin = vec3(0.0, 0.0, 3.0);
    vec3 rayDir = normalize(vec3(uv, -1.5));

    // 黑洞位于原点
    vec3 blackHolePos = vec3(0.0);
    float rs = u_schwarzschildRadius;

    // ---- Raymarching ----
    vec3 pos = rayOrigin;
    float stepSize = 0.05;
    vec3 accumulatedColor = vec3(0.0);
    float accretionAlpha = 0.0;
    bool swallowed = false;

    for (int i = 0; i < 256; i++) {
        // 运行时上限控制（GLSL ES 不支持动态循环上限）
        if (i >= u_maxSteps) break;

        vec3 toCenter = blackHolePos - pos;
        float dist = length(toCenter);

        // 光线被吞噬：进入事件视界
        if (dist < rs) {
            swallowed = true;
            break;
        }

        // ---- 引力透镜：弯曲光线方向 ----
        // 简化偏转公式: deflection ∝ 1 / dist²
        float deflectionStrength = rs * rs * 1.5;
        vec3 deflection = normalize(toCenter) * (deflectionStrength / (dist * dist));
        rayDir = normalize(rayDir + deflection);

        // ---- 吸积盘检测 ----
        // 吸积盘在 xz 平面, 半径范围 [1.5*rs, 3.0*rs]
        float innerRing = rs * 1.5;
        float outerRing = rs * 3.0;

        // 检测光线是否穿过 y=0 平面附近（盘面厚度）
        float diskThickness = rs * 0.08;
        if (abs(pos.y) < diskThickness && dist > innerRing && dist < outerRing) {
            // 极坐标着色
            float angle = atan(pos.z, pos.x);
            // 旋转动画
            float rotatedAngle = angle + u_time * 1.5;

            // 盘面亮度：内环更亮
            float radialFade = 1.0 - smoothstep(innerRing, outerRing, dist);
            radialFade = pow(radialFade, 0.6);

            // 角向条纹结构（模拟密度波）
            float spiral = noise1D(rotatedAngle * 3.0 + dist * 20.0);
            float arms = 0.5 + 0.5 * sin(rotatedAngle * 4.0 - dist * 30.0 + u_time * 2.0);

            float diskBrightness = radialFade * (0.5 + 0.5 * spiral) * (0.6 + 0.4 * arms);

            // 多普勒偏色：一侧偏蓝，另一侧偏红
            float doppler = 0.5 + 0.5 * sin(angle + u_time * 0.8);
            vec3 diskColor = mix(
                u_accretionColor * vec3(1.4, 0.6, 0.3),  // 红移侧
                u_accretionColor * vec3(0.5, 0.8, 1.5),  // 蓝移侧
                doppler
            );

            // 累积吸积盘颜色（前-后合成）
            float sampleAlpha = diskBrightness * 0.15;
            accumulatedColor += diskColor * diskBrightness * sampleAlpha * (1.0 - accretionAlpha);
            accretionAlpha += sampleAlpha * (1.0 - accretionAlpha);
        }

        // 前进光线（距离衰减步长：靠近黑洞时步长更小）
        pos += rayDir * stepSize;
        stepSize *= 1.05;

        // 安全距离截断
        if (dist > 10.0) break;
    }

    vec3 finalColor;

    if (swallowed) {
        // 被黑洞吞噬 —— 纯黑
        finalColor = accumulatedColor;
    } else {
        // 采样扭曲后的环境贴图（引力透镜效果）
        vec3 envColor = textureCube(u_envMap, rayDir).rgb;

        // 合成：背景 + 吸积盘
        finalColor = mix(envColor, accumulatedColor, accretionAlpha);
    }

    // 中心暗化（事件视界阴影）
    vec2 screenCenter = (vUv - 0.5) * 2.0;
    screenCenter.x *= aspect;
    float centerDist = length(screenCenter);
    float shadowMask = smoothstep(rs * 0.6, rs * 1.2, centerDist);
    finalColor *= mix(0.0, 1.0, shadowMask);

    gl_FragColor = vec4(finalColor, 1.0);
}
