'use client';

import Link from 'next/link';
import { useCosmicStore } from '@/stores/cosmicStore';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export default function Breadcrumb() {
  const currentGalaxy = useCosmicStore((s) => s.currentGalaxy);
  const currentPlanet = useCosmicStore((s) => s.currentPlanet);
  const viewMode = useCosmicStore((s) => s.viewMode);

  const items: BreadcrumbItem[] = [{ label: 'Universe', href: '/' }];

  if (currentGalaxy) {
    items.push({ label: currentGalaxy, href: `/galaxy/${currentGalaxy}` });
  }
  if (currentPlanet) {
    items.push({ label: currentPlanet, href: `/post/${currentPlanet}` });
  }

  if (viewMode === 'universe' && items.length === 1) return null;

  return (
    <nav className="fixed left-4 top-4 z-[55]">
      <div className="flex items-center gap-1 rounded border border-cosmic-frost/10 bg-cosmic-void/70 px-3 py-1.5 font-mono text-xs text-cosmic-frost/50 backdrop-blur-sm">
        {items.map((item, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <span className="text-cosmic-frost/20">›</span>}
            {item.href ? (
              <Link
                href={item.href}
                className="text-cosmic-frost/50 transition-colors hover:text-cosmic-glow"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-cosmic-glow">{item.label}</span>
            )}
          </span>
        ))}
      </div>
    </nav>
  );
}
