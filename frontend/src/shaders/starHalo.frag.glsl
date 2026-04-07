// CyberGeek Cosmic Engine — Star Halo Fragment Shader
//
// Noise-modulated Fresnel glow shell around the star body.

precision highp float;

uniform float u_time;
uniform float u_haloOpacity;
uniform float u_pulseSpeed;
uniform float u_granulationScale;
uniform float u_flowSpeed;
uniform float u_baseTemperature;
uniform float u_seed;

varying vec3 vNormal;
varying vec3 vViewDir;
varying vec3 vLocalPos;

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

// FBM
float fbm4(vec3 p) {
    float value = 0.0;
    float amp = 1.0;
    float freq = 1.0;
    float maxV = 0.0;
    for (int i = 0; i < 4; i++) {
        value += snoise(p * freq) * amp;
        maxV += amp;
        freq *= 2.0;
        amp *= 0.58;
    }
    return value / maxV;
}

// Blackbody color (simplified for halo)
vec3 haloBlackbody(float tempK) {
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
    vec3 N = normalize(vNormal);
    vec3 V = normalize(vViewDir);
    float NdotV = max(dot(N, V), 0.0);

    // Animated halo direction (slower than body: 0.4x flow speed)
    float c = cos(u_time * u_flowSpeed * 0.4);
    float s = sin(u_time * u_flowSpeed * 0.4);
    vec3 haloFlow = vec3(
        c * vLocalPos.x + s * vLocalPos.z,
        vLocalPos.y,
        -s * vLocalPos.x + c * vLocalPos.z
    );

    // FBM noise modulation
    float haloNoise = fbm4(haloFlow * u_granulationScale * 0.8 + vec3(u_time * 0.04, 0.0, u_seed)) * 0.5 + 0.5;

    // Fresnel² edge enhancement
    float haloFresnel = pow(1.0 - NdotV, 2.0);

    // Pulsation (0.75x body speed)
    float haloPulse = sin(u_time * u_pulseSpeed * 0.75) * 0.5 + 0.5;

    // Opacity
    float opacity = haloFresnel * haloFresnel * mix(0.26, 0.62, haloNoise) * u_haloOpacity * (haloPulse * 0.3 + 0.7);

    // Color: base halo + corona tint
    vec3 haloColor = haloBlackbody(u_baseTemperature);
    vec3 coronaColor = haloBlackbody(u_baseTemperature * 1.2);
    vec3 color = mix(haloColor, coronaColor, haloNoise * 0.24);

    // Boost brightness
    color = mix(vec3(1.0), color, 0.8);

    gl_FragColor = vec4(color * opacity, opacity);
}
