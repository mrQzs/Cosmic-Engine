'use client';

import { useRef, useEffect, useCallback } from 'react';
import { MINIMAP } from '@/config/universeLayout';
import type { GalaxyData } from '@/hooks/useUniverseData';

/**
 * Standalone DOM-based minimap component.
 * Renders on a 2D canvas overlay.
 */
export function MiniMapDOM({
  galaxies,
  cameraPosition,
  onClickPosition,
}: {
  galaxies: GalaxyData[];
  cameraPosition: [number, number, number];
  onClickPosition?: (x: number, z: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = MINIMAP.size;
    const scale = size / 4000; // Map ±2000 to canvas

    ctx.clearRect(0, 0, size, size);

    // Background
    ctx.fillStyle = 'rgba(10, 10, 26, 0.8)';
    ctx.fillRect(0, 0, size, size);

    // Border
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, size, size);

    // Center crosshair
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.1)';
    ctx.beginPath();
    ctx.moveTo(size / 2, 0);
    ctx.lineTo(size / 2, size);
    ctx.moveTo(0, size / 2);
    ctx.lineTo(size, size / 2);
    ctx.stroke();

    // Galaxy dots
    galaxies.forEach((g) => {
      const x = (g.position.x + 2000) * scale;
      const z = (g.position.z + 2000) * scale;
      ctx.fillStyle = g.colorScheme.primary;
      ctx.beginPath();
      ctx.arc(x, z, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Camera position (blinking arrow)
    const cx = (cameraPosition[0] + 2000) * scale;
    const cz = (cameraPosition[2] + 2000) * scale;
    const blink = Math.sin(Date.now() * 0.005) > 0;
    if (blink) {
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(cx, cz - 5);
      ctx.lineTo(cx - 3, cz + 3);
      ctx.lineTo(cx + 3, cz + 3);
      ctx.closePath();
      ctx.fill();
    }
  }, [galaxies, cameraPosition]);

  useEffect(() => {
    // Update at ~5fps (every updateInterval frames at 60fps ≈ every 83ms, but use 200ms for DOM canvas)
    const intervalMs = Math.round((MINIMAP.updateInterval / 60) * 1000);
    const interval = setInterval(draw, intervalMs || 200);
    draw();
    return () => clearInterval(interval);
  }, [draw]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!onClickPosition) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scale = MINIMAP.size / 4000;
      const x = (e.clientX - rect.left) / scale - 2000;
      const z = (e.clientY - rect.top) / scale - 2000;
      onClickPosition(x, z);
    },
    [onClickPosition],
  );

  return (
    <canvas
      ref={canvasRef}
      width={MINIMAP.size}
      height={MINIMAP.size}
      className="fixed bottom-4 right-4 z-[55] cursor-crosshair rounded-lg border border-cosmic-frost/10 backdrop-blur-sm"
      style={{ width: 128, height: 128 }}
      onClick={handleClick}
    />
  );
}
