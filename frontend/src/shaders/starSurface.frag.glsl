// CyberGeek Cosmic Engine — Star Surface Fragment Shader
//
// Physically-inspired procedural star surface:
//   - Blackbody radiation color (11-stop LUT)
//   - Domain-warped 3D Worley granulation (convection cells)
//   - Magnetic sunspot model (umbra + penumbra with filaments)
//   - Eddington limb darkening
//   - Fresnel rim highlight + pulsation
//
// Reference: webgpu-stars-demo (adapted from TSL to GLSL)

precision highp float;

// ---- Uniforms ----
uniform float u_time;
uniform float u_seed;
uniform float u_pixelSize;

// Temperature
uniform float u_baseTemperature;
uniform float u_temperatureRange;

// Granulation
uniform float u_granulationScale;
uniform float u_flowSpeed;

// Sunspot magnetic model
uniform float u_spotScale;
uniform float u_umbraThreshold;
uniform float u_penumbraThreshold;
uniform float u_umbraDropK;
uniform float u_penumbraDropK;

// Limb darkening
uniform float u_limbDarkeningStrength;

// Pulsation
uniform float u_pulseSpeed;
uniform float u_pulseAmount;

// Rim highlight
uniform float u_rimPower;
uniform float u_rimBoost;

// ---- Varyings ----
varying vec3 vNormal;
varying vec3 vWorldPosition;
varying vec3 vViewDir;
varying vec3 vSurfaceDirection;

// =============================================================
// Noise helpers
// =============================================================

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

// 3D Simplex noise
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

// FBM (Fractal Brownian Motion) using simplex noise
float fbm(vec3 p, int octaves, float lacunarity, float persistence) {
    float value = 0.0;
    float amplitude = 1.0;
    float frequency = 1.0;
    float maxVal = 0.0;
    for (int i = 0; i < 5; i++) {
        if (i >= octaves) break;
        value += snoise(p * frequency) * amplitude;
        maxVal += amplitude;
        frequency *= lacunarity;
        amplitude *= persistence;
    }
    return value / maxVal;
}

// 3D Worley (cellular) noise — returns distance to nearest cell center
vec3 worleyHash(vec3 p) {
    p = vec3(dot(p, vec3(127.1, 311.7, 74.7)),
             dot(p, vec3(269.5, 183.3, 246.1)),
             dot(p, vec3(113.5, 271.9, 124.6)));
    return fract(sin(p) * 43758.5453123);
}

float worley3D(vec3 p, float jitter) {
    vec3 ip = floor(p);
    vec3 fp = fract(p);
    float d = 1.0;
    for (int z = -1; z <= 1; z++)
    for (int y = -1; y <= 1; y++)
    for (int x = -1; x <= 1; x++) {
        vec3 neighbor = vec3(float(x), float(y), float(z));
        vec3 point = worleyHash(ip + neighbor) * jitter;
        vec3 diff = neighbor + point - fp;
        d = min(d, dot(diff, diff));
    }
    return sqrt(d);
}

// =============================================================
// Blackbody color LUT (11 stops, piecewise smoothstep)
// =============================================================

vec3 blackbodyColor(float tempK) {
    float t = clamp(tempK, 1000.0, 40000.0);

    vec3 color = vec3(1.0, 0.03, 0.0); // 1000K deep red
    color = mix(color, vec3(1.0, 0.18, 0.0),   smoothstep(1000.0,  2000.0,  t));
    color = mix(color, vec3(1.0, 0.36, 0.06),  smoothstep(2000.0,  3000.0,  t));
    color = mix(color, vec3(1.0, 0.55, 0.18),  smoothstep(3000.0,  4000.0,  t));
    color = mix(color, vec3(1.0, 0.70, 0.30),  smoothstep(4000.0,  5000.0,  t));
    color = mix(color, vec3(1.0, 0.78, 0.45),  smoothstep(5000.0,  5800.0,  t));
    color = mix(color, vec3(1.0, 0.88, 0.68),  smoothstep(5800.0,  6500.0,  t));
    color = mix(color, vec3(0.75, 0.82, 1.0),  smoothstep(6500.0,  8000.0,  t));
    color = mix(color, vec3(0.58, 0.68, 1.0),  smoothstep(8000.0,  10000.0, t));
    color = mix(color, vec3(0.45, 0.55, 1.0),  smoothstep(10000.0, 15000.0, t));
    color = mix(color, vec3(0.35, 0.46, 1.0),  smoothstep(15000.0, 40000.0, t));

    return color;
}

// =============================================================
// Rotation helper (rotate around Y axis)
// =============================================================

vec3 rotateY(vec3 p, float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);
}

// =============================================================
// Granule noise: inverted Worley with FBM domain warping
// =============================================================

float granuleNoise(vec3 pos, float scale, float flowTime, float pixelSize) {
    // Domain warping: low-freq FBM displaces sampling coords
    float warpFreq = scale * 0.15;
    float warpX = fbm(pos * warpFreq, 3, 2.0, 0.6);
    float warpY = fbm(pos * warpFreq + vec3(31.7, 17.3, 0.0), 3, 2.0, 0.6);
    float warpZ = fbm(pos * warpFreq + vec3(0.0, 59.1, 23.5), 3, 2.0, 0.6);
    vec3 warpOffset = vec3(warpX, warpY, warpZ) * 2.5;

    // Animated position: slow z-drift for convection evolution
    vec3 animatedPos = pos + vec3(0.0, 0.0, flowTime * 0.3);
    vec3 warpedPos = animatedPos * scale + warpOffset;

    // Large-scale granulation (primary convection cells)
    float worleyLarge = worley3D(warpedPos, 0.85);
    float granuleLarge = pow(1.0 - worleyLarge, 2.5);

    // Small-scale mesogranulation
    float worleySmall = worley3D(warpedPos * 2.8, 0.85);
    float granuleSmall = pow(1.0 - worleySmall, 2.5);

    // 70% large + 30% small
    float baseGranule = mix(granuleLarge, granuleSmall, 0.3);

    // Distance-adaptive multi-octave detail layers
    // pixelSize = starScale / distance; larger = closer camera
    float fineMix = smoothstep(0.15, 0.5, pixelSize);
    if (fineMix > 0.01) {
        // Mesogranulation layer (7x frequency)
        float worleyFine = worley3D(warpedPos * 7.0, 0.85);
        float fineDetail = pow(1.0 - worleyFine, 2.5);
        baseGranule = mix(baseGranule, fineDetail, fineMix * 0.3);

        // Sub-granulation layer (20x frequency) — only very close
        float ultraMix = smoothstep(0.5, 2.0, pixelSize);
        if (ultraMix > 0.01) {
            float worleyUltra = worley3D(warpedPos * 20.0, 0.85);
            float ultraDetail = pow(1.0 - worleyUltra, 2.5);
            baseGranule = mix(baseGranule, ultraDetail, ultraMix * 0.2);
        }
    }

    return baseGranule;
}

// =============================================================
// Sunspot temperature drop (magnetic field model)
// =============================================================

float sunspotDrop(vec3 pos, float spotScale, float spotTime,
                  float umbraThreshold, float penumbraThreshold,
                  float umbraDropK, float penumbraDropK) {
    // Slowly-evolving magnetic field proxy
    vec3 magPos = pos * spotScale + vec3(0.0, spotTime * 0.02, 0.0);
    float magField = fbm(magPos, 2, 2.0, 0.55);
    float absMag = abs(magField);

    // Umbra: where magnetic field exceeds high threshold
    float umbra = smoothstep(umbraThreshold, umbraThreshold + 0.12, absMag);

    // Penumbra: transition zone
    float penumbra = smoothstep(penumbraThreshold, umbraThreshold, absMag);

    // Penumbra radial filaments via gradient-based stretching
    float eps = 0.015;
    float gradX = fbm(magPos + vec3(eps, 0.0, 0.0), 2, 2.0, 0.55)
                - fbm(magPos - vec3(eps, 0.0, 0.0), 2, 2.0, 0.55);
    float gradY = fbm(magPos + vec3(0.0, eps, 0.0), 2, 2.0, 0.55)
                - fbm(magPos - vec3(0.0, eps, 0.0), 2, 2.0, 0.55);
    float gradZ = fbm(magPos + vec3(0.0, 0.0, eps), 2, 2.0, 0.55)
                - fbm(magPos - vec3(0.0, 0.0, eps), 2, 2.0, 0.55);
    vec3 grad = vec3(gradX, gradY, gradZ);
    float gradLen = max(length(grad), 0.0001);
    grad /= gradLen;

    // Stretch coords along gradient → radial filament pattern
    vec3 stretchedPos = pos + grad * penumbra * 0.15;
    float filament = snoise(stretchedPos * spotScale * 8.0);
    float filamentFactor = clamp(filament * 0.5 + 0.5, 0.3, 1.0);

    // Temperature drop
    float umbraDrop = umbra * umbraDropK;
    float penumbraDrop = penumbra * (1.0 - umbra) * penumbraDropK * filamentFactor;

    return -(umbraDrop + penumbraDrop);
}

// =============================================================
// Main
// =============================================================

void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(vViewDir);
    float NdotV = max(dot(N, V), 0.0);

    // Surface direction in local space (for noise sampling)
    vec3 surfDir = normalize(vSurfaceDirection);

    // Animated flow: rotate surface sampling around Y
    float flowTime = u_time * u_flowSpeed;
    vec3 surfaceFlow = rotateY(surfDir, flowTime);

    // ---- LOD: simplified path at distance ----
    // u_pixelSize = starScale / distance → small value = far away
    if (u_pixelSize < 0.05) {
        // Cheap path: simplex noise only
        float n = snoise(surfaceFlow * u_granulationScale * 0.3 + u_seed) * 0.5 + 0.5;
        float spot = smoothstep(0.15, 0.3, snoise(surfaceFlow * u_spotScale + u_time * 0.02) * 0.5 + 0.5);
        float surface = n * 0.6 + 0.4;
        surface *= mix(0.4, 1.0, spot);
        float localTemp = u_baseTemperature + (surface - 0.5) * u_temperatureRange;
        float limbFactor = 1.0 - u_limbDarkeningStrength + u_limbDarkeningStrength * pow(NdotV, 0.5);
        vec3 color = blackbodyColor(localTemp * limbFactor);
        float lum = dot(color, vec3(0.2126, 0.7152, 0.0722));
        color = mix(vec3(lum), color, 2.2);
        color *= surface * 0.8 + 0.2;
        gl_FragColor = vec4(color * 1.4, 1.0);
        return;
    }

    // ---- Full quality path ----

    // 1. Granulation (domain-warped inverted Worley)
    float granuleValue = granuleNoise(surfaceFlow + u_seed, u_granulationScale, flowTime, u_pixelSize);

    // 2. Large-scale macro noise (broad surface variation)
    float macroNoise = fbm(surfaceFlow * u_granulationScale * 0.5, 5, 2.05, 0.56) * 0.5 + 0.5;

    // Blend macro variation into granule for broader detail
    granuleValue = mix(granuleValue, macroNoise, 0.2);

    // 3. Sunspot temperature drop
    float spotDrop = sunspotDrop(surfDir, u_spotScale, u_time,
                                 u_umbraThreshold, u_penumbraThreshold,
                                 u_umbraDropK, u_penumbraDropK);

    // 4. Temperature calculation
    float granuleDelta = granuleValue - 0.4;
    float latitudeBoost = pow(1.0 - abs(surfDir.y), 1.7) * 0.08;
    float localTemp = u_baseTemperature
                    + granuleDelta * u_temperatureRange
                    + spotDrop
                    + latitudeBoost * u_temperatureRange;

    // 5. Limb darkening (Eddington approximation)
    float limbFactor = 1.0 - u_limbDarkeningStrength
                     + u_limbDarkeningStrength * pow(NdotV, 0.5);
    localTemp *= limbFactor;

    // 6. Blackbody color lookup
    vec3 surfaceRgb = blackbodyColor(localTemp);

    // 7. Saturation boost (compensate tone mapping desaturation)
    float lum = dot(surfaceRgb, vec3(0.2126, 0.7152, 0.0722));
    surfaceRgb = mix(vec3(lum), surfaceRgb, 2.2);

    // 8. Surface brightness modulation
    float surfaceBrightness = granuleValue * 0.4 + latitudeBoost + 0.58;

    // 9. Pulsation
    float pulse = sin(u_time * u_pulseSpeed + surfDir.y * 9.0) * u_pulseAmount + 1.0;

    // 10. Rim (Fresnel) highlight
    float fresnel = pow(1.0 - NdotV, u_rimPower);
    vec3 rimColor = blackbodyColor(u_baseTemperature * 1.2);
    vec3 rim = rimColor * fresnel * u_rimBoost * 0.05;

    // 11. Final emission
    vec3 emission = surfaceRgb * surfaceBrightness * pulse + rim;

    gl_FragColor = vec4(emission, 1.0);
}
