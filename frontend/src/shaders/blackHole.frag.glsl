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
//
// 增强技术 (参考 webgpu-black-hole):
//   1. 动态相机 — 真实相机位置驱动射线, 支持任意视距/角度
//   2. 自适应步长 — 远距大步, 近BH细步
//   3. 循环湍流交叉淡入 — 防止噪声无限缠绕
//   4. 增强多普勒增亮 — D³ 束射效应
//   5. 黑体辐射 LUT — Mitchell Charity CIE 1931 色温→RGB
//   6. 各向异性噪声 — 径向/方位角不同拉伸

precision highp float;

uniform float       u_time;
uniform float       u_schwarzschildRadius;
uniform vec3        u_accretionColor;   // Per-galaxy tint blended with blackbody
uniform int         u_maxSteps;
uniform samplerCube u_envMap;
uniform vec3        u_cameraLocalPos;   // Camera in BH rest frame (shader units)
uniform float       u_billboardHalfSize; // Billboard half-extent (shader units)
uniform vec3        u_cameraRight;      // Camera right basis (galaxy-local, normalized)
uniform vec3        u_cameraUp;         // Camera up basis (galaxy-local, normalized)

varying vec2 vUv;

const float PI = 3.14159265359;

// ==================== Hash & Noise ====================

float hash(float n) {
    return fract(sin(n) * 43758.5453123);
}

float hash31(vec3 p) {
    return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
}

// 3D value noise (smooth interpolation of hash grid)
float noise3D(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = f * f * (3.0 - 2.0 * f); // smoothstep

    float a = hash31(i);
    float b = hash31(i + vec3(1, 0, 0));
    float c = hash31(i + vec3(0, 1, 0));
    float d = hash31(i + vec3(1, 1, 0));
    float e = hash31(i + vec3(0, 0, 1));
    float f2 = hash31(i + vec3(1, 0, 1));
    float g = hash31(i + vec3(0, 1, 1));
    float h = hash31(i + vec3(1, 1, 1));

    return mix(
        mix(mix(a, b, u.x), mix(c, d, u.x), u.y),
        mix(mix(e, f2, u.x), mix(g, h, u.x), u.y),
        u.z
    );
}

// Fractal Brownian Motion — 4 octaves
float fbm(vec3 p, float lacunarity, float persistence) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 4; i++) {
        value += noise3D(p) * amplitude;
        p *= lacunarity;
        amplitude *= persistence;
    }
    return value;
}

// ==================== Blackbody Color LUT ====================
// Mitchell Charity CIE 1931 2-deg, sRGB
// Analytical approximation (piecewise polynomial)

vec3 blackbodyColor(float tempK) {
    float t = clamp(tempK, 1000.0, 40000.0);

    float r, g, b;

    if (t < 6600.0) {
        r = 1.0;
        g = clamp(0.39 * log(t / 1000.0) - 0.12, 0.0, 1.0);
        if (t < 2000.0) {
            b = 0.0;
        } else {
            b = clamp(0.34 * log(t / 1000.0 - 1.0) - 0.14, 0.0, 1.0);
        }
    } else {
        r = clamp(1.29 * pow(t / 6600.0, -0.1332), 0.0, 1.0);
        g = clamp(1.13 * pow(t / 6600.0, -0.0755), 0.0, 1.0);
        b = 1.0;
    }

    return vec3(r, g, b);
}

// ==================== Accretion Disk ====================

vec4 sampleDisk(float hitR, float hitAngle, float rs, vec3 rayDir) {
    float innerR = rs * 3.0;  // ISCO = 3rs (Schwarzschild exact)
    float outerR = rs * 12.0;

    if (hitR < innerR || hitR > outerR) return vec4(0.0);

    float rNorm = (hitR - innerR) / (outerR - innerR);

    // 边缘柔化 — wider outer falloff for natural fade
    float edgeFade = smoothstep(0.0, 0.18, rNorm) * smoothstep(1.0, 0.5, rNorm);

    // ---- 1. 黑体辐射色温 (reference: peakTemp=50000, falloff=5.22) ----
    float peakTemp = 50000.0;
    float tempK = peakTemp * pow(innerR / hitR, 5.0);
    // Accent color controls hue, blackbody controls brightness gradient
    vec3 bbColor = blackbodyColor(tempK);
    float lum = dot(bbColor, vec3(0.299, 0.587, 0.114));
    // Hot inner: white-tinted accent. Cool outer: pure accent color.
    vec3 hotColor = mix(u_accretionColor, vec3(1.0), 0.6);
    vec3 coolColor = u_accretionColor * 0.9;
    float tempMix = smoothstep(2000.0, 20000.0, tempK);
    vec3 diskColor = mix(coolColor, hotColor, tempMix) * lum * 2.5;

    // ---- 2. 增强多普勒束射 D³ ----
    float v = sqrt(rs / (2.0 * hitR));
    float rotSign = -1.0; // match reference rotation direction
    vec3 velocity = vec3(-sin(hitAngle), 0.0, cos(hitAngle)) * v * rotSign;
    float cosTheta = dot(normalize(velocity), normalize(rayDir));
    float beta = v * 0.3;
    float dopplerFactor = 1.0 / max(1.0 - beta * cosTheta, 0.1);
    float dopplerBoost = clamp(pow(dopplerFactor, 3.0), 0.15, 4.0);
    diskColor *= dopplerBoost;

    // ---- 3. 循环湍流 + 各向异性噪声 ----
    float cycleLength = 5.0;
    float cyclicTime = mod(u_time, cycleLength);
    float blendFactor = cyclicTime / cycleLength;

    float rotSpeed = 8.7;
    float keplerPhase1 = cyclicTime * rotSpeed / pow(hitR / innerR, 1.5);
    float keplerPhase2 = (cyclicTime + cycleLength) * rotSpeed / pow(hitR / innerR, 1.5);
    float rotAngle1 = hitAngle + keplerPhase1;
    float rotAngle2 = hitAngle + keplerPhase2;

    float turbScale = 1.81;
    float stretch = 0.75;
    vec3 noiseCoord1 = vec3(
        hitR * turbScale,
        cos(rotAngle1) / stretch,
        sin(rotAngle1) / stretch
    );
    vec3 noiseCoord2 = vec3(
        hitR * turbScale,
        cos(rotAngle2) / stretch,
        sin(rotAngle2) / stretch
    );

    float turb1 = fbm(noiseCoord1, 3.0, 0.8);
    float turb2 = fbm(noiseCoord2, 3.0, 0.8);
    float turbulence = mix(turb2, turb1, blendFactor);
    // Sharpness — contrast boost (reference: 7.4)
    turbulence = pow(clamp(turbulence, 0.0, 1.0), 5.0);

    float brightness = (0.3 + 0.7 * turbulence) * edgeFade * 4.0;
    brightness *= pow(1.0 - rNorm, 0.6);

    float alpha = clamp(brightness * 0.8, 0.0, 1.0);

    return vec4(diskColor * brightness, alpha);
}

void main() {
    vec2 uv = (vUv - 0.5) * 2.0; // [-1, 1] on square billboard

    float rs = u_schwarzschildRadius;

    // ===== Dynamic camera ray setup =====
    vec3 camPos = u_cameraLocalPos;
    float camDist = length(camPos);

    // Degenerate guard
    if (camDist < 0.001) {
        gl_FragColor = vec4(0.0);
        return;
    }

    // Camera basis: forward from camera toward BH center,
    // right/up from actual camera orientation (matches billboard UV axes).
    // Orthogonalize right/up against forward to ensure consistency
    // when camera isn't looking exactly at BH center.
    vec3 forward = normalize(-camPos);
    vec3 right = normalize(u_cameraRight - forward * dot(forward, u_cameraRight));
    vec3 up = normalize(u_cameraUp - forward * dot(forward, u_cameraUp));

    // Billboard angular half-extent: tan(halfAngle) = halfSize / distance
    float viewScale = u_billboardHalfSize / camDist;
    vec3 rayDir = normalize(forward + right * uv.x * viewScale + up * uv.y * viewScale);
    vec3 origDir = rayDir;

    // ===== Adaptive raymarching parameters =====
    // Base step scales with camera distance; finer steps near BH
    float baseStep = max(0.05, camDist * 0.015);
    float escapeRadius = max(15.0, camDist * 1.5);

    // Raymarching state
    vec3 pos = camPos;
    vec3 accumulatedColor = vec3(0.0);
    float alpha = 0.0;
    bool swallowed = false;
    float prevY = pos.y;
    float minDist = length(camPos); // track closest approach to BH

    for (int i = 0; i < 256; i++) {
        if (i >= u_maxSteps) break;

        float dist = length(pos);
        minDist = min(minDist, dist);

        // Adaptive step: fine near event horizon, coarse when far
        float stepSize = baseStep * clamp(dist / (rs * 5.0), 0.15, 1.0);

        // ===== 事件视界: r ≤ rs*1.05 → 被吞噬 (slightly wider to prevent skip-over) =====
        if (dist < rs * 1.05) {
            swallowed = true;
            break;
        }

        // ===== 引力偏转: bendStrength = 2.4 * rs / r² (reference: gravitationalLensing=2.4) =====
        float bendStrength = 2.4 * rs / (dist * dist);
        vec3 toCenter = normalize(-pos);
        rayDir = normalize(rayDir + toCenter * bendStrength * stepSize);

        // 前进
        vec3 newPos = pos + rayDir * stepSize;

        // ===== 盘面穿越检测 (y 变号) — 解析交叉 =====
        if (prevY * newPos.y < 0.0 && alpha < 0.95) {
            float t = abs(prevY) / (abs(prevY) + abs(newPos.y));
            vec3 hitPos = mix(pos, newPos, t);
            float hitR = length(hitPos);
            float hitAngle = atan(hitPos.z, hitPos.x);

            vec4 diskSample = sampleDisk(hitR, hitAngle, rs, rayDir);
            if (diskSample.a > 0.0) {
                float remaining = 1.0 - alpha;
                accumulatedColor += diskSample.rgb * diskSample.a * remaining;
                alpha += diskSample.a * remaining;
                alpha = min(alpha, 1.0);
            }
        }

        prevY = newPos.y;
        pos = newPos;

        // 逃逸
        if (dist > escapeRadius) break;
        // 已不透明
        if (alpha > 0.99) break;
    }

    // Rays that exhausted step budget near the BH are effectively captured
    if (!swallowed && minDist < rs * 2.5) {
        swallowed = true;
    }

    // ===== 最终颜色 =====
    vec3 finalColor;

    if (swallowed) {
        finalColor = accumulatedColor;
    } else {
        vec3 envColor = textureCube(u_envMap, rayDir).rgb;
        // Rays that approached the photon sphere are extremely redshifted —
        // aggressively darken background based on closest approach distance.
        float shadowFade = smoothstep(rs * 2.0, rs * 8.0, minDist);
        envColor *= shadowFade;
        finalColor = mix(envColor, accumulatedColor, alpha);
    }

    // Billboard 边缘淡出
    float edgeDist = length((vUv - 0.5) * 2.0);
    float edgeFade = 1.0 - smoothstep(0.92, 1.0, edgeDist);

    float outAlpha;
    if (swallowed) {
        outAlpha = 1.0;
    } else {
        float deflection = 1.0 - dot(origDir, rayDir);
        float lensingAlpha = smoothstep(0.0, 0.1, deflection);
        outAlpha = max(alpha, lensingAlpha);
    }

    outAlpha *= edgeFade;

    // Gamma 校正 (线性→sRGB)
    finalColor = pow(finalColor, vec3(1.0 / 2.2));

    gl_FragColor = vec4(finalColor, outAlpha);
}
