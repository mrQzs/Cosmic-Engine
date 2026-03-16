// CyberGeek Cosmic Engine — Dither Fade LOD Transition
//
// Dithered transparency 用于 LOD 平滑过渡。
// 使用屏幕坐标伪随机 dither 模式配合 discard 实现无需 alpha blend 的淡入淡出。
// 极简高效，适用于大量 LOD 对象的交叉过渡。
//
// ═══════════════════════════════════════════════════════════
// 用法 (Three.js ShaderMaterial):
//   new THREE.ShaderMaterial({
//     uniforms: {
//       u_fadeProgress: { value: 0.0 },   // 0 = 完全显示, 1 = 完全隐藏
//       u_map:          { value: texture } // 可选：基础贴图
//     },
//     fragmentShader: ditherFadeSource,
//     // vertexShader: 需传出 vUv
//   });
//
// ═══════════════════════════════════════════════════════════
// 通过 onBeforeCompile 注入到任意 Material:
//
//   material.onBeforeCompile = (shader) => {
//     // 1. 添加 uniform
//     shader.uniforms.u_fadeProgress = { value: 0.0 };
//
//     // 2. 在 fragment shader 最前面添加 uniform 声明
//     shader.fragmentShader = `
//       uniform float u_fadeProgress;
//     ` + shader.fragmentShader;
//
//     // 3. 在 fragment shader 的 main() 开头注入 dither discard 逻辑
//     //    替换 'void main() {' 为带 dither 检查的版本
//     shader.fragmentShader = shader.fragmentShader.replace(
//       '#include <dithering_fragment>',
//       `
//       // -- Dither Fade LOD --
//       {
//         vec2 screenPos = gl_FragCoord.xy;
//         float dither = fract(
//           dot(screenPos, vec2(12.9898, 78.233)) * 43758.5453
//         );
//         // 添加 2x2 棋盘格子交错，减少视觉规律感
//         float checker = mod(floor(screenPos.x) + floor(screenPos.y), 2.0) * 0.5;
//         dither = fract(dither + checker * 0.5);
//         if (dither < u_fadeProgress) discard;
//       }
//       #include <dithering_fragment>
//       `
//     );
//
//     // 4. 保存 shader 引用以便动态更新 u_fadeProgress
//     material.userData.shader = shader;
//   };
//
//   // 在渲染循环中更新:
//   if (material.userData.shader) {
//     material.userData.shader.uniforms.u_fadeProgress.value = lodFadeValue;
//   }
// ═══════════════════════════════════════════════════════════

precision highp float;

uniform float u_fadeProgress;
uniform sampler2D u_map;

varying vec2 vUv;

void main() {
    // ---- Dither 计算 ----
    // 使用屏幕像素坐标生成伪随机 dither 值
    vec2 screenPos = gl_FragCoord.xy;

    // 主 hash：基于屏幕坐标的伪随机值 [0, 1)
    float dither = fract(
        sin(dot(screenPos, vec2(12.9898, 78.233))) * 43758.5453
    );

    // 棋盘格交错：减少视觉上的规律性条纹
    // 奇偶像素交替偏移 dither 值，使过渡更均匀
    float checker = mod(floor(screenPos.x) + floor(screenPos.y), 2.0);
    dither = fract(dither + checker * 0.5);

    // ---- Discard 判断 ----
    // u_fadeProgress = 0: 不 discard 任何像素（完全显示）
    // u_fadeProgress = 1: discard 所有像素（完全隐藏）
    // 中间值: 按 dither 概率逐步 discard
    if (dither < u_fadeProgress) {
        discard;
    }

    // ---- 基础着色 ----
    // 如果绑定了贴图则采样，否则输出白色
    vec4 texColor = texture2D(u_map, vUv);
    gl_FragColor = texColor;
}
