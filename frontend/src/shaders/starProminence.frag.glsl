// CyberGeek Cosmic Engine — Star Prominence Arc Fragment Shader
//
// Renders solar prominences as glowing plasma arcs with:
//   - Plasma density variation (Perlin noise)
//   - Cross-section Fresnel (center bright, edges fade)
//   - Endpoint fade-in/fade-out
//   - Traveling wave + global breathing
//   - Intermittent flare bursts with temperature shift

precision highp float;

uniform float u_time;
uniform float u_arcIndex;
uniform float u_prominenceSpeed;
uniform float u_prominenceIntensity;
uniform float u_prominenceTemp;

varying vec2 vUv;
varying vec3 vLocalPos;
varying vec3 vNormal;
varying vec3 vViewDir;

// Simplex noise (compact)
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

// Blackbody color (simplified)
vec3 blackbodyColor(float tempK) {
    float t = clamp(tempK, 1000.0, 40000.0);
    vec3 color = vec3(1.0, 0.03, 0.0);
    color = mix(color, vec3(1.0, 0.36, 0.06),  smoothstep(1000.0,  3000.0,  t));
    color = mix(color, vec3(1.0, 0.70, 0.30),  smoothstep(3000.0,  5000.0,  t));
    color = mix(color, vec3(1.0, 0.78, 0.45),  smoothstep(5000.0,  5800.0,  t));
    color = mix(color, vec3(1.0, 0.88, 0.68),  smoothstep(5800.0,  6500.0,  t));
    color = mix(color, vec3(0.75, 0.82, 1.0),  smoothstep(6500.0,  8000.0,  t));
    color = mix(color, vec3(0.58, 0.68, 1.0),  smoothstep(8000.0,  15000.0, t));
    color = mix(color, vec3(0.35, 0.46, 1.0),  smoothstep(15000.0, 40000.0, t));
    return color;
}

void main() {
    float alongArc = vUv.x;   // 0 at start, 1 at end
    float aroundTube = vUv.y;  // 0..1 around cross-section

    // Cross-section Fresnel: center bright, edges fade
    float tubeCenter = abs(aroundTube - 0.5) * 2.0;
    float tubeFresnel = pow(1.0 - tubeCenter, 2.0);

    // Endpoint fade-in/fade-out
    float endFade = smoothstep(0.0, 0.12, alongArc) * smoothstep(1.0, 0.88, alongArc);

    // Plasma density variation (Perlin noise along arc)
    float plasmaNoise = snoise(vec3(alongArc * 5.0 + u_arcIndex * 17.3 + u_time * 0.3, u_arcIndex * 3.1, 0.0));
    float densityVariation = plasmaNoise * 0.4 + 0.6;

    // Traveling wave along arc
    float travelWave = sin(u_time * u_prominenceSpeed + alongArc * 6.0 + u_arcIndex * 2.1) * 0.3 + 0.7;

    // Global breathing
    float breathing = sin(u_time * u_prominenceSpeed * 0.6 + u_arcIndex * 1.7) * 0.15 + 0.85;

    // Intermittent flare burst (sharp spike)
    float flareSin = sin(u_time * 0.4 + u_arcIndex * 3.7);
    float flarePulse = pow(max(flareSin, 0.0), 20.0);

    // Temperature shift during flare (warm → blue-white burst)
    float flareTemp = mix(u_prominenceTemp, u_prominenceTemp + 7000.0, flarePulse);
    vec3 baseColor = blackbodyColor(flareTemp);

    // Flare boosts brightness
    float flareBoost = flarePulse * 2.0 + 1.0;

    // Combined modulation
    float brightness = tubeFresnel * endFade * densityVariation * travelWave * breathing
                     * flareBoost * u_prominenceIntensity * 1.5;

    vec3 color = baseColor * brightness;
    float opacity = clamp(brightness * 0.6, 0.0, 0.9);

    gl_FragColor = vec4(color, opacity);
}
