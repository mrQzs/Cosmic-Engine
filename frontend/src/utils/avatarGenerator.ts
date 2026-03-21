/**
 * Procedural space-themed SVG avatar generator.
 * Deterministic: same avatarSeed always produces the same avatar.
 */

// Seeded PRNG (mulberry32)
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFromHex(hex: string): number {
  let h = 0;
  for (let i = 0; i < hex.length; i++) {
    h = (Math.imul(31, h) + hex.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

const COSMIC_PALETTE = [
  '#38bdf8', // glow cyan
  '#6b21a8', // nebula purple
  '#fb923c', // plasma orange
  '#a78bfa', // violet
  '#34d399', // emerald
  '#f472b6', // pink
  '#fbbf24', // amber
  '#22d3ee', // teal
  '#818cf8', // indigo
  '#f87171', // coral
];

const SHAPES = ['circle', 'hexagon', 'diamond'] as const;

const PATTERNS = ['stars', 'rings', 'grid', 'constellation'] as const;

function hexagonPath(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return `M${pts.join('L')}Z`;
}

function diamondPath(cx: number, cy: number, r: number): string {
  return `M${cx},${cy - r} L${cx + r},${cy} L${cx},${cy + r} L${cx - r},${cy}Z`;
}

function drawPattern(
  rng: () => number,
  pattern: (typeof PATTERNS)[number],
  colors: string[],
  cx: number,
  cy: number,
  r: number,
): string {
  let svg = '';
  const c1 = colors[0];
  const c2 = colors[1] || colors[0];

  switch (pattern) {
    case 'stars': {
      const n = 3 + Math.floor(rng() * 4);
      for (let i = 0; i < n; i++) {
        const sx = cx + (rng() - 0.5) * r * 1.4;
        const sy = cy + (rng() - 0.5) * r * 1.4;
        const sr = 1 + rng() * 3;
        svg += `<circle cx="${sx}" cy="${sy}" r="${sr}" fill="${i % 2 === 0 ? c1 : c2}" opacity="0.8"/>`;
      }
      break;
    }
    case 'rings': {
      const n = 2 + Math.floor(rng() * 3);
      for (let i = 0; i < n; i++) {
        const rr = (r * 0.3 + i * r * 0.2) * (0.8 + rng() * 0.4);
        svg += `<circle cx="${cx}" cy="${cy}" r="${rr}" fill="none" stroke="${i % 2 === 0 ? c1 : c2}" stroke-width="1.5" opacity="0.6"/>`;
      }
      break;
    }
    case 'grid': {
      const step = r * 0.4;
      for (let x = cx - r * 0.6; x <= cx + r * 0.6; x += step) {
        for (let y = cy - r * 0.6; y <= cy + r * 0.6; y += step) {
          if (rng() > 0.4) {
            svg += `<rect x="${x - 1.5}" y="${y - 1.5}" width="3" height="3" fill="${rng() > 0.5 ? c1 : c2}" opacity="0.5" rx="0.5"/>`;
          }
        }
      }
      break;
    }
    case 'constellation': {
      const pts: [number, number][] = [];
      const n = 4 + Math.floor(rng() * 3);
      for (let i = 0; i < n; i++) {
        pts.push([cx + (rng() - 0.5) * r * 1.4, cy + (rng() - 0.5) * r * 1.4]);
      }
      // Connect nearby points
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          if (rng() > 0.5) {
            svg += `<line x1="${pts[i][0]}" y1="${pts[i][1]}" x2="${pts[j][0]}" y2="${pts[j][1]}" stroke="${c1}" stroke-width="0.8" opacity="0.4"/>`;
          }
        }
        svg += `<circle cx="${pts[i][0]}" cy="${pts[i][1]}" r="2" fill="${c2}" opacity="0.9"/>`;
      }
      break;
    }
  }
  return svg;
}

/**
 * Generate a cosmic-themed SVG avatar from an avatar seed.
 * @param avatarSeed - hex string (typically 16 chars from SHA-256)
 * @param size - pixel size of the SVG
 * @returns SVG string
 */
export function generateAvatar(avatarSeed: string, size = 64): string {
  const rng = mulberry32(seedFromHex(avatarSeed));

  // Pick shape
  const shape = SHAPES[Math.floor(rng() * SHAPES.length)];

  // Pick 2-3 colors
  const c1 = COSMIC_PALETTE[Math.floor(rng() * COSMIC_PALETTE.length)];
  let c2 = COSMIC_PALETTE[Math.floor(rng() * COSMIC_PALETTE.length)];
  if (c2 === c1) c2 = COSMIC_PALETTE[(COSMIC_PALETTE.indexOf(c1) + 3) % COSMIC_PALETTE.length];
  const colors = [c1, c2];

  // Pick pattern
  const pattern = PATTERNS[Math.floor(rng() * PATTERNS.length)];

  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.42;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`;
  svg += `<rect width="${size}" height="${size}" fill="#0a0a1a" rx="${size * 0.12}"/>`;

  // Background gradient
  svg += `<defs><radialGradient id="bg"><stop offset="0%" stop-color="${c1}" stop-opacity="0.15"/><stop offset="100%" stop-color="${c2}" stop-opacity="0.05"/></radialGradient></defs>`;
  svg += `<rect width="${size}" height="${size}" fill="url(#bg)" rx="${size * 0.12}"/>`;

  // Clip mask for shape
  svg += `<defs><clipPath id="shape">`;
  switch (shape) {
    case 'circle':
      svg += `<circle cx="${cx}" cy="${cy}" r="${r}"/>`;
      break;
    case 'hexagon':
      svg += `<path d="${hexagonPath(cx, cy, r)}"/>`;
      break;
    case 'diamond':
      svg += `<path d="${diamondPath(cx, cy, r)}"/>`;
      break;
  }
  svg += `</clipPath></defs>`;

  // Shape outline
  switch (shape) {
    case 'circle':
      svg += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${c1}" stroke-width="1.5" opacity="0.6"/>`;
      break;
    case 'hexagon':
      svg += `<path d="${hexagonPath(cx, cy, r)}" fill="none" stroke="${c1}" stroke-width="1.5" opacity="0.6"/>`;
      break;
    case 'diamond':
      svg += `<path d="${diamondPath(cx, cy, r)}" fill="none" stroke="${c1}" stroke-width="1.5" opacity="0.6"/>`;
      break;
  }

  // Inner pattern (clipped)
  svg += `<g clip-path="url(#shape)">`;
  svg += drawPattern(rng, pattern, colors, cx, cy, r);
  svg += `</g>`;

  svg += `</svg>`;
  return svg;
}

/** Convert SVG string to a data URL for use as image src */
export function avatarToDataUrl(avatarSeed: string, size = 64): string {
  const svg = generateAvatar(avatarSeed, size);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
