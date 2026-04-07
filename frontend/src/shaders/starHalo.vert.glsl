// CyberGeek Cosmic Engine — Star Halo Vertex Shader

varying vec3 vNormal;
varying vec3 vViewDir;
varying vec3 vLocalPos;

void main() {
    vLocalPos = normalize(position);
    vNormal = normalize(normalMatrix * normal);

    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mvPos.xyz);

    gl_Position = projectionMatrix * mvPos;
}
