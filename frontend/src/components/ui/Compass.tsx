'use client';

import type { GalaxyData } from '@/hooks/useUniverseData';

interface CompassProps {
  galaxies: GalaxyData[];
  cameraPosition: [number, number, number];
  screenWidth: number;
  screenHeight: number;
}

interface CompassArrow {
  name: string;
  angle: number;
  distance: number;
  color: string;
  screenX: number;
  screenY: number;
}

/**
 * Edge arrows pointing to off-screen galaxies with name + distance labels.
 */
export default function Compass({
  galaxies,
  cameraPosition,
  screenWidth,
  screenHeight,
}: CompassProps) {
  const margin = 60;
  const arrows: CompassArrow[] = [];

  galaxies.forEach((g) => {
    const dx = g.position.x - cameraPosition[0];
    const dz = g.position.z - cameraPosition[2];
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < 200) return; // Too close, skip

    const angle = Math.atan2(dz, dx);
    const cx = screenWidth / 2;
    const cy = screenHeight / 2;

    // Project to screen edge
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const maxX = screenWidth / 2 - margin;
    const maxY = screenHeight / 2 - margin;

    const scaleX = cos !== 0 ? Math.abs(maxX / cos) : Infinity;
    const scaleY = sin !== 0 ? Math.abs(maxY / sin) : Infinity;
    const scale = Math.min(scaleX, scaleY);

    arrows.push({
      name: g.name,
      angle,
      distance: Math.round(dist),
      color: g.colorScheme.primary,
      screenX: cx + cos * scale,
      screenY: cy + sin * scale,
    });
  });

  return (
    <div className="pointer-events-none fixed inset-0 z-[54]">
      {arrows.map((arrow) => (
        <div
          key={arrow.name}
          className="absolute flex items-center gap-1"
          style={{
            left: arrow.screenX,
            top: arrow.screenY,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <span
            className="text-lg"
            style={{
              color: arrow.color,
              transform: `rotate(${arrow.angle}rad)`,
              display: 'inline-block',
            }}
          >
            →
          </span>
          <span className="whitespace-nowrap font-mono text-[10px] text-cosmic-frost/40">
            {arrow.name} ({arrow.distance})
          </span>
        </div>
      ))}
    </div>
  );
}
