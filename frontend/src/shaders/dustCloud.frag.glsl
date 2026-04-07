/**
 * Dust cloud fragment shader with cloud texture + vertex colors.
 * Additive blending handled by material blendMode, not shader.
 */
uniform sampler2D uCloudMap;
uniform float uOpacity;

varying vec3 vColor;

void main() {
  vec4 texel = texture2D(uCloudMap, gl_PointCoord);
  gl_FragColor = vec4(vColor * texel.rgb, texel.a * uOpacity);
}
