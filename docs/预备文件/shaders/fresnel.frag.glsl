// CyberGeek Cosmic Engine — Fresnel Atmosphere
//
// 行星大气层 Fresnel 边缘发光效果。
// 边缘亮、中心透明，模拟大气散射光晕。
//
// 用法 (Three.js ShaderMaterial):
//   new THREE.ShaderMaterial({
//     uniforms: {
//       u_fresnelPower:    { value: 3.0 },
//       u_atmosphereColor: { value: new THREE.Color(0x4488ff) },
//       u_opacity:         { value: 1.0 }
//     },
//     vertexShader: fresnelVertSource,   // 需传出 vNormal, vViewDir
//     fragmentShader: fresnelFragSource,
//     transparent: true,
//     blending: THREE.AdditiveBlending,
//     side: THREE.BackSide,              // 大气层球体略大于行星，背面渲染
//     depthWrite: false
//   });
//
// 配套 Vertex Shader 要点:
//   varying vec3 vNormal;
//   varying vec3 vViewDir;
//   void main() {
//     vec4 worldPos = modelMatrix * vec4(position, 1.0);
//     vNormal  = normalize(normalMatrix * normal);
//     vViewDir = normalize(cameraPosition - worldPos.xyz);
//     gl_Position = projectionMatrix * viewMatrix * worldPos;
//   }

precision highp float;

uniform float u_fresnelPower;
uniform vec3  u_atmosphereColor;
uniform float u_opacity;

varying vec3 vNormal;
varying vec3 vViewDir;

void main() {
    // 归一化插值后的向量（插值可能导致非单位长度）
    vec3 normal  = normalize(vNormal);
    vec3 viewDir = normalize(vViewDir);

    // 经典 Fresnel 公式
    // dot(viewDir, normal) 在正面为 1（中心），边缘趋向 0
    float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), u_fresnelPower);

    // 边缘发光颜色
    vec3 color = u_atmosphereColor * fresnel;

    // alpha 也由 fresnel 控制：边缘不透明，中心完全透明
    float alpha = fresnel * u_opacity;

    gl_FragColor = vec4(color, alpha);
}
