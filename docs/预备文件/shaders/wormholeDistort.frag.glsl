// CyberGeek Cosmic Engine — Wormhole UV Distortion
//
// 虫洞事件视界的空间扭曲效果。
// 将 UV 坐标转为极坐标，根据到中心距离施加螺旋式扭曲。
// 中心区域扭曲最强，边缘过渡到正常背景，最内层有明亮的事件视界光环。
//
// 用法 (Three.js ShaderMaterial):
//   new THREE.ShaderMaterial({
//     uniforms: {
//       u_time:           { value: 0.0 },
//       u_distortStrength:{ value: 2.5 },
//       u_envMap:         { value: equirectTexture }  // 等距柱面映射全景图
//     },
//     fragmentShader: wormholeSource,
//     // vertexShader: 全屏四边形 vertex shader，传出 vUv
//   });
//
// 注意: u_envMap 使用 sampler2D（等距柱面映射），而非 samplerCube。
//       纹理需设置 wrapS/wrapT = THREE.RepeatWrapping 以实现无缝环绕。

precision highp float;

uniform float     u_time;
uniform float     u_distortStrength;
uniform sampler2D u_envMap;

varying vec2 vUv;

const float PI  = 3.14159265359;
const float TAU = 6.28318530718;

void main() {
    // 将 UV 中心化到 [-0.5, 0.5]
    vec2 centeredUV = vUv - 0.5;

    // 转极坐标
    float radius = length(centeredUV);
    float angle  = atan(centeredUV.y, centeredUV.x);

    // ---- 扭曲参数 ----
    // 扭曲强度随距离中心减小而增大（中心最强）
    // 使用 1/radius 曲线，smoothstep 平滑截断防止除零
    float distortFalloff = smoothstep(0.0, 0.5, radius);    // 0 在中心, 1 在边缘
    float distortAmount = u_distortStrength * (1.0 - distortFalloff);

    // 螺旋旋转：角度偏移 = 强度 / 半径（靠近中心旋转更多圈）
    float spiralTwist = distortAmount / (radius + 0.01);     // +0.01 防止除零
    spiralTwist += u_time * 0.3;                             // 随时间旋转

    float distortedAngle = angle + spiralTwist;

    // 径向压缩/拉伸：中心区域径向收缩（空间弯曲感）
    float radialWarp = radius + 0.05 * sin(radius * 20.0 - u_time * 2.0) * (1.0 - distortFalloff);

    // ---- 从扭曲后的极坐标采样环境贴图 ----
    // 等距柱面映射: u = angle/2π, v = 基于径向映射
    float envU = fract(distortedAngle / TAU);
    // 将径向距离映射到纬度（中心=背面极点, 边缘=正面）
    float envV = clamp(radialWarp * 2.0, 0.0, 1.0);

    vec2 distortedUV = vec2(envU, envV);
    vec3 envColor = texture2D(u_envMap, distortedUV).rgb;

    // ---- 事件视界光环 ----
    // 在特定半径处产生明亮的光环
    float horizonRadius = 0.06;
    float horizonWidth  = 0.025;
    float horizonRing = smoothstep(horizonRadius - horizonWidth, horizonRadius, radius)
                      * smoothstep(horizonRadius + horizonWidth, horizonRadius, radius);

    // 光环颜色：亮白带浅蓝
    vec3 horizonColor = vec3(0.7, 0.85, 1.0) * 3.0;

    // 光环脉动
    float horizonPulse = 0.8 + 0.2 * sin(u_time * 4.0);
    horizonRing *= horizonPulse;

    // ---- 中心极暗区域（虫洞喉部） ----
    float throatDark = smoothstep(0.04, 0.0, radius);

    // ---- 边缘过渡到正常背景 ----
    // 在外围逐渐消除扭曲
    vec3 normalBG = texture2D(u_envMap, vUv).rgb;
    float edgeBlend = smoothstep(0.3, 0.5, radius);

    // ---- 最终合成 ----
    vec3 finalColor = mix(envColor, normalBG, edgeBlend);  // 扭曲 → 正常过渡
    finalColor += horizonColor * horizonRing;               // 叠加事件视界光环
    finalColor *= (1.0 - throatDark);                       // 中心暗化

    gl_FragColor = vec4(finalColor, 1.0);
}
