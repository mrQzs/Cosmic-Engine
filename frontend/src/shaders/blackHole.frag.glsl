// CyberGeek Cosmic Engine — Black Hole Gravitational Lensing
//
// 简化施瓦西度规光线弯曲 + 吸积盘 Raymarching。
// 光线在黑洞引力场中弯曲，扭曲背景星空 (envMap)，
// 并在 Schwarzschild 半径 ×1.5~3 范围内渲染旋转吸积盘。

precision highp float;

uniform float      u_time;
uniform vec2       u_resolution;
uniform float      u_schwarzschildRadius;
uniform vec3       u_accretionColor;
uniform int        u_maxSteps;
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

void main() {
    vec2 uv = (vUv - 0.5) * 2.0;
    float aspect = u_resolution.x / u_resolution.y;
    uv.x *= aspect;

    // 光线初始化
    vec3 rayOrigin = vec3(0.0, 0.0, 2.5);
    vec3 rayDir = normalize(vec3(uv, -1.0));

    vec3 blackHolePos = vec3(0.0);
    float rs = u_schwarzschildRadius;

    // Raymarching
    vec3 pos = rayOrigin;
    float stepSize = 0.03;
    vec3 accumulatedColor = vec3(0.0);
    float accretionAlpha = 0.0;
    bool swallowed = false;

    for (int i = 0; i < 256; i++) {
        if (i >= u_maxSteps) break;

        vec3 toCenter = blackHolePos - pos;
        float dist = length(toCenter);

        if (dist < rs * 0.8) {
            swallowed = true;
            break;
        }

        // 引力透镜偏转
        float deflectionStrength = rs * rs * 2.0;
        vec3 deflection = normalize(toCenter) * (deflectionStrength / (dist * dist));
        rayDir = normalize(rayDir + deflection);

        // 吸积盘检测
        float innerRing = rs * 1.5;
        float outerRing = rs * 4.0;
        float diskThickness = rs * 0.15;

        if (abs(pos.y) < diskThickness && dist > innerRing && dist < outerRing) {
            float angle = atan(pos.z, pos.x);
            float rotatedAngle = angle + u_time * 1.2;

            // 径向亮度：内环更亮
            float radialFade = 1.0 - smoothstep(innerRing, outerRing, dist);
            radialFade = pow(radialFade, 0.5);

            // 旋臂结构
            float spiral = noise1D(rotatedAngle * 3.0 + dist * 15.0);
            float arms = 0.5 + 0.5 * sin(rotatedAngle * 3.0 - dist * 20.0 + u_time * 1.5);

            float diskBrightness = radialFade * (0.4 + 0.6 * spiral) * (0.5 + 0.5 * arms);

            // 多普勒偏色
            float doppler = 0.5 + 0.5 * sin(angle + u_time * 0.8);
            vec3 diskColor = mix(
                u_accretionColor * vec3(1.6, 0.7, 0.3),
                u_accretionColor * vec3(0.5, 0.9, 1.8),
                doppler
            );

            // 提高采样 alpha（之前 0.15 太低，改为 0.4）
            float sampleAlpha = diskBrightness * 0.4;
            accumulatedColor += diskColor * diskBrightness * 2.0 * sampleAlpha * (1.0 - accretionAlpha);
            accretionAlpha += sampleAlpha * (1.0 - accretionAlpha);
            accretionAlpha = min(accretionAlpha, 1.0);
        }

        pos += rayDir * stepSize;
        stepSize *= 1.03;

        if (dist > 8.0) break;
    }

    vec3 finalColor;

    if (swallowed) {
        finalColor = accumulatedColor;
    } else {
        vec3 envColor = textureCube(u_envMap, rayDir).rgb;
        finalColor = mix(envColor, accumulatedColor, accretionAlpha);
    }

    // 事件视界阴影
    vec2 screenCenter = (vUv - 0.5) * 2.0;
    screenCenter.x *= aspect;
    float centerDist = length(screenCenter);
    float shadowMask = smoothstep(rs * 0.5, rs * 1.5, centerDist);
    finalColor *= shadowMask;

    // 事件视界边缘发光（光子球）
    float photonRing = smoothstep(rs * 0.9, rs * 1.1, centerDist) * (1.0 - smoothstep(rs * 1.1, rs * 1.6, centerDist));
    finalColor += u_accretionColor * photonRing * 1.5;
    accretionAlpha = max(accretionAlpha, photonRing * 0.8);

    // 边缘淡出（圆形）
    float edgeDist = length((vUv - 0.5) * 2.0);
    float edgeFade = 1.0 - smoothstep(0.6, 1.0, edgeDist);

    // Alpha: 事件视界内不透明黑色 + 吸积盘 + 光子环
    float holeAlpha = (1.0 - shadowMask) * 0.95; // 中心黑洞本体
    float alpha = max(max(accretionAlpha, holeAlpha), photonRing) * edgeFade;

    gl_FragColor = vec4(finalColor, alpha);
}
