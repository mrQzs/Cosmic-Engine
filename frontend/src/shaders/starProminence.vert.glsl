// CyberGeek Cosmic Engine — Star Prominence Vertex Shader

varying vec2 vUv;
varying vec3 vLocalPos;
varying vec3 vNormal;
varying vec3 vViewDir;

void main() {
    vUv = uv;
    vLocalPos = position;
    vNormal = normalize(normalMatrix * normal);

    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mvPos.xyz);

    gl_Position = projectionMatrix * mvPos;
}
