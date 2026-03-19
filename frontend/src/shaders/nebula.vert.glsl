// CyberGeek Cosmic Engine — Nebula Vertex Shader
//
// Curl noise displacement for nebula particles.
// Displaces point positions along divergence-free flow fields.

uniform float u_time;
uniform float u_noiseScale;
uniform float u_noiseSpeed;

attribute float aSize;

varying vec3 vColor;
varying float vAlpha;

// Simplex noise 3D (compact version)
vec3 mod289v(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289v4(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permutev(vec4 x) { return mod289v4(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrtv(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise3(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g, l.zxy);
    vec3 i2 = max(g, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - 0.5;
    i = mod289v(i);
    vec4 p = permutev(permutev(permutev(
        i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * vec3(7.0, 1.0, 0.0).wyz - vec3(7.0, 1.0, 0.0).xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrtv(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}

// Curl noise (divergence-free vector field)
vec3 curlNoise(vec3 p) {
    float e = 0.01;
    float n1, n2;
    vec3 curl;

    n1 = snoise3(vec3(p.x, p.y + e, p.z));
    n2 = snoise3(vec3(p.x, p.y - e, p.z));
    float dz_dy = (n1 - n2) / (2.0 * e);
    n1 = snoise3(vec3(p.x, p.y, p.z + e));
    n2 = snoise3(vec3(p.x, p.y, p.z - e));
    float dy_dz = (n1 - n2) / (2.0 * e);
    curl.x = dz_dy - dy_dz;

    n1 = snoise3(vec3(p.x, p.y, p.z + e));
    n2 = snoise3(vec3(p.x, p.y, p.z - e));
    float dx_dz = (n1 - n2) / (2.0 * e);
    n1 = snoise3(vec3(p.x + e, p.y, p.z));
    n2 = snoise3(vec3(p.x - e, p.y, p.z));
    float dz_dx = (n1 - n2) / (2.0 * e);
    curl.y = dx_dz - dz_dx;

    n1 = snoise3(vec3(p.x + e, p.y, p.z));
    n2 = snoise3(vec3(p.x - e, p.y, p.z));
    float dy_dx = (n1 - n2) / (2.0 * e);
    n1 = snoise3(vec3(p.x, p.y + e, p.z));
    n2 = snoise3(vec3(p.x, p.y - e, p.z));
    float dx_dy = (n1 - n2) / (2.0 * e);
    curl.z = dy_dx - dx_dy;

    return curl;
}

void main() {
    // Animate curl noise displacement
    vec3 noisePos = position * u_noiseScale + u_time * u_noiseSpeed;
    vec3 displacement = curlNoise(noisePos) * 5.0;

    vec3 newPos = position + displacement;
    vec4 mvPosition = modelViewMatrix * vec4(newPos, 1.0);

    // Distance-based alpha fade
    float dist = length(position);
    vAlpha = smoothstep(80.0, 20.0, dist) * 0.6;
    vColor = vec3(1.0); // Will be overridden by uniform in material

    gl_PointSize = aSize * (200.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
}
