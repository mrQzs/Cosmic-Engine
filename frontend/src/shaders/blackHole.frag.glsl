// CyberGeek Cosmic Engine — Black Hole Gravitational Lensing
//
// 参考 Dan Greenheck "Raytracing a Black Hole with WebGPU"
// 基于 Schwarzschild 度规的光线偏转:
//   偏转力 = 1.5 * rs / r² (per step)
//
// 关键半径:
//   事件视界 = rs,  光子球 = 1.5rs,  ISCO = 3rs
//
// 盘面穿越检测: y 变号时插值精确交点
// 多次穿越 → 吸积盘自然"包裹"黑洞上下 (Jean-Pierre Luminet 1979)

precision highp float;

uniform float       u_time;
uniform vec2        u_resolution;
uniform float       u_schwarzschildRadius;
uniform vec3        u_accretionColor;
uniform int         u_maxSteps;
uniform samplerCube u_envMap;

varying vec2 vUv;

const float PI = 3.14159265359;

float hash(float n) {
    return fract(sin(n) * 43758.5453123);
}

float noise1D(float p) {
    float i = floor(p);
    float f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(hash(i), hash(i + 1.0), f);
}

// 吸积盘采样: 盘面交点 → 颜色 + alpha
vec4 sampleDisk(float hitR, float hitAngle, float rs, vec3 rayDir) {
    float innerR = rs * 3.0;  // ISCO = 3rs
    float outerR = rs * 8.0;

    if (hitR < innerR || hitR > outerR) return vec4(0.0);

    // 归一化径向 [0,1]
    float rNorm = (hitR - innerR) / (outerR - innerR);

    // 边缘柔化
    float edgeFade = smoothstep(0.0, 0.15, rNorm) * smoothstep(1.0, 0.85, rNorm);

    // 径向亮度: 内亮外暗 (T ∝ r^{-3/4})
    float radialBright = pow(1.0 - rNorm, 0.75);

    // Kepler 差分旋转: ω ∝ r^{-3/2}
    float keplerPhase = u_time * 1.5 / pow(hitR / innerR, 1.5);
    float rotAngle = hitAngle + keplerPhase;

    // 旋臂/湍流结构
    float spiral = noise1D(rotAngle * 3.0 + hitR * 12.0);
    float spiral2 = noise1D(rotAngle * 7.0 - hitR * 8.0 + u_time * 0.2);
    float arms = 0.5 + 0.5 * sin(rotAngle * 3.0 - hitR * 18.0);
    float turbulence = (0.3 + 0.5 * spiral + 0.2 * spiral2) * (0.5 + 0.5 * arms);

    // 温度梯度: 内(蓝白) → 外(红橙)
    float tempFactor = pow(1.0 - rNorm, 0.75);
    vec3 diskColor = mix(vec3(1.0, 0.4, 0.15), vec3(0.8, 0.9, 1.0), tempFactor) * u_accretionColor;

    // 物理多普勒束射 D³
    // Kepler 速度: v = sqrt(rs / 2r), 方向为切线
    float v = sqrt(rs / (2.0 * hitR)) * 0.5; // 缩放以控制视觉强度
    vec3 velocity = vec3(-sin(hitAngle), 0.0, cos(hitAngle)) * v;
    float cosTheta = dot(normalize(velocity), normalize(rayDir));
    float denom = max(1.0 - v * cosTheta, 0.15);
    float doppler = clamp(1.0 / denom, 0.3, 3.5);
    diskColor *= doppler * doppler * doppler;

    float brightness = radialBright * turbulence * edgeFade * 2.5;
    float alpha = brightness * 0.5;

    return vec4(diskColor * brightness, alpha);
}

void main() {
    vec2 uv = (vUv - 0.5) * 2.0;
    float aspect = u_resolution.x / u_resolution.y;
    uv.x *= aspect;

    float rs = u_schwarzschildRadius;

    // 光线初始化
    vec3 pos = vec3(0.0, 0.0, 3.0);
    vec3 rayDir = normalize(vec3(uv, -1.0));

    // Raymarching 状态
    vec3 accumulatedColor = vec3(0.0);
    float alpha = 0.0;
    bool swallowed = false;
    float prevY = pos.y;
    float stepSize = 0.06; // 参考: 保证 128步 × 0.06 ≈ 7.7 单位路径

    for (int i = 0; i < 256; i++) {
        if (i >= u_maxSteps) break;

        float dist = length(pos);

        // ===== 事件视界: r ≤ rs → 被吞噬 =====
        if (dist < rs * 1.01) {
            swallowed = true;
            break;
        }

        // ===== 引力偏转: bendStrength = 1.5 * rs / r² =====
        // 参考 Dan Greenheck 实现, gravitationalLensing = 1.5
        float bendStrength = 1.5 * rs / (dist * dist);
        vec3 toCenter = normalize(-pos);
        rayDir = normalize(rayDir + toCenter * bendStrength * stepSize);

        // 前进
        vec3 newPos = pos + rayDir * stepSize;

        // ===== 盘面穿越检测 (y 变号) =====
        if (prevY * newPos.y < 0.0 && alpha < 0.95) {
            float t = abs(prevY) / (abs(prevY) + abs(newPos.y));
            vec3 hitPos = mix(pos, newPos, t);
            float hitR = length(hitPos);
            float hitAngle = atan(hitPos.z, hitPos.x);

            vec4 diskSample = sampleDisk(hitR, hitAngle, rs, rayDir);
            if (diskSample.a > 0.0) {
                // 前向合成: 新颜色叠加在已有之上
                float remaining = 1.0 - alpha;
                accumulatedColor += diskSample.rgb * diskSample.a * remaining;
                alpha += diskSample.a * remaining;
                alpha = min(alpha, 1.0);
            }
        }

        prevY = newPos.y;
        pos = newPos;

        // 逃逸
        if (dist > 10.0) break;
        // 已不透明
        if (alpha > 0.99) break;
    }

    // ===== 最终颜色 =====
    vec3 finalColor;

    if (swallowed) {
        // 事件视界内: 背景为纯黑，只保留途中积累的盘光
        finalColor = accumulatedColor;
    } else {
        // 逃逸光线: 用偏转后的方向采样环境贴图
        vec3 envColor = textureCube(u_envMap, rayDir).rgb;
        finalColor = mix(envColor, accumulatedColor, alpha);
    }

    // billboard 边缘淡出
    float edgeDist = length((vUv - 0.5) * 2.0);
    float edgeFade = 1.0 - smoothstep(0.75, 1.0, edgeDist);

    // Alpha 策略:
    // - swallowed → 完全不透明 (事件视界 = 不透光黑体)
    // - 逃逸 → 用偏转角判断受引力影响程度
    float outAlpha;
    if (swallowed) {
        outAlpha = 1.0;
    } else {
        vec3 origDir = normalize(vec3(uv, -1.0));
        float deflection = 1.0 - dot(origDir, rayDir);
        float lensingAlpha = smoothstep(0.0, 0.1, deflection);
        outAlpha = max(alpha, lensingAlpha);
    }

    outAlpha *= edgeFade;
    gl_FragColor = vec4(finalColor, outAlpha);
}
