/**
 * Dust cloud vertex shader with per-particle size support.
 * Reads 'size' attribute for variable gl_PointSize (PointsMaterial ignores it).
 *
 * `color` attribute is auto-injected by Three.js when vertexColors=true.
 */
attribute float size;

varying vec3 vColor;

void main() {
  vColor = color;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  // Perspective-scaled point size, clamped to prevent
  // infinite sizes near camera and negative values behind camera
  gl_PointSize = clamp(size * (300.0 / -mvPosition.z), 0.0, 256.0);
  gl_Position = projectionMatrix * mvPosition;
}
