// CyberGeek Cosmic Engine — Planet Surface Fragment Shader
//
// Multi-octave procedural noise for planet surface textures.
// Supports simplex, perlin, voronoi, and fbm noise types.
// Colored by baseColorHSL, modulated by surfaceRoughness.

precision highp float;

uniform vec3  u_baseColor;        // Base color (pre-converted to RGB)
uniform float u_surfaceRoughness; // [0, 1] surface detail
uniform float u_textureSeed;      // Noise offset for variation
uniform float u_time;
uniform float u_glowIntensity;    // [0, 1] emissive glow
uniform float u_fadeProgress;     // [0, 1] macro↔micro blend

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPosition;
varying vec3 vViewDir;

// --- Simplex noise helpers ---
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    i = mod289(i);
    vec4 p = permute(permute(permute(
        i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;

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

    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

// FBM (fractal Brownian motion) — multi-octave noise
float fbm(vec3 p, int octaves) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    for (int i = 0; i < 6; i++) {
        if (i >= octaves) break;
        value += amplitude * snoise(p * frequency);
        frequency *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

// Simple 2D hash for voronoi
vec2 voronoiHash(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return fract(sin(p) * 43758.5453);
}

// Voronoi distance
float voronoi(vec3 p) {
    vec2 uv = p.xy + p.z * 0.37;
    vec2 ip = floor(uv);
    vec2 fp = fract(uv);
    float d = 1.0;
    for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
            vec2 neighbor = vec2(float(x), float(y));
            vec2 point = voronoiHash(ip + neighbor);
            point = 0.5 + 0.5 * sin(u_time * 0.3 + 6.2831 * point);
            vec2 diff = neighbor + point - fp;
            d = min(d, dot(diff, diff));
        }
    }
    return sqrt(d);
}

void main() {
    // Offset noise coordinates by textureSeed for per-planet variation
    vec3 noiseCoord = vWorldPosition * 0.15 + u_textureSeed;

    // Multi-octave terrain noise
    int octaves = int(mix(3.0, 6.0, u_surfaceRoughness));
    float terrain = fbm(noiseCoord, octaves);

    // Add voronoi detail at close range (controlled by fadeProgress)
    float microDetail = voronoi(noiseCoord * 3.0) * u_fadeProgress;
    terrain = mix(terrain, microDetail, u_fadeProgress * 0.5);

    // Map noise to color: darker in valleys, brighter on ridges
    float brightness = 0.4 + terrain * 0.6;
    brightness = clamp(brightness, 0.0, 1.0);

    // Apply surface color with roughness-based detail
    vec3 color = u_baseColor * brightness;

    // Add subtle color variation based on noise
    vec3 variation = vec3(
        snoise(noiseCoord * 2.0 + 100.0),
        snoise(noiseCoord * 2.0 + 200.0),
        snoise(noiseCoord * 2.0 + 300.0)
    ) * 0.08;
    color += variation;

    // Enhanced lighting model
    vec3 N = normalize(vNormal);
    vec3 V = normalize(vViewDir);
    vec3 lightDir = normalize(vec3(1.0, 0.5, 0.8));
    float NdotL = max(dot(N, lightDir), 0.0);

    // Diffuse with lower ambient floor for solid dark-side terminator
    float lighting = 0.15 + 0.85 * NdotL;
    color *= lighting;

    // Blinn-Phong specular — shininess scales with smoothness
    float shininess = mix(8.0, 64.0, 1.0 - u_surfaceRoughness);
    vec3 H = normalize(lightDir + V);
    float spec = pow(max(dot(N, H), 0.0), shininess);
    // Only apply specular on lit side
    spec *= step(0.01, NdotL);
    color += vec3(1.0, 0.97, 0.9) * spec * 0.25 * (1.0 - u_surfaceRoughness);

    // Rim lighting — separates planet silhouette from dark background
    float NdotV = max(dot(N, V), 0.0);
    float rim = pow(1.0 - NdotV, 3.0) * 0.2;
    color += u_baseColor * rim;

    // Emissive glow
    color += u_baseColor * u_glowIntensity * 0.3;

    gl_FragColor = vec4(color, 1.0);
}
