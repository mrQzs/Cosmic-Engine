'use client';

import { useEffect, useState, useCallback } from 'react';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  containerRef: React.RefObject<HTMLElement | null>;
}

export default function TableOfContents({ containerRef }: TableOfContentsProps) {
  const [items, setItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState('');

  // Parse headings from DOM
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const headings = container.querySelectorAll('h2, h3, h4');
    const tocItems: TocItem[] = [];
    headings.forEach((heading) => {
      const el = heading as HTMLElement;
      if (el.id) {
        tocItems.push({
          id: el.id,
          text: el.textContent?.replace(/#$/, '').trim() ?? '',
          level: parseInt(el.tagName.charAt(1)),
        });
      }
    });
    setItems(tocItems);
  }, [containerRef]);

  // Intersection observer for active section
  useEffect(() => {
    const container = containerRef.current;
    if (!container || items.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      {
        root: container,
        rootMargin: '-20% 0px -60% 0px',
      },
    );

    items.forEach((item) => {
      const el = container.querySelector(`#${CSS.escape(item.id)}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [containerRef, items]);

  const scrollTo = useCallback(
    (id: string) => {
      const container = containerRef.current;
      if (!container) return;
      const el = container.querySelector(`#${CSS.escape(id)}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    [containerRef],
  );

  if (items.length === 0) return null;

  return (
    <nav className="hidden xl:block fixed right-8 top-1/2 -translate-y-1/2 z-[55] w-56">
      <div className="hud-panel p-4">
        <h3 className="mb-3 font-mono text-xs uppercase tracking-wider text-cosmic-glow/70">
          Contents
        </h3>
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.id} style={{ paddingLeft: `${(item.level - 2) * 12}px` }}>
              <button
                onClick={() => scrollTo(item.id)}
                className={`block w-full text-left text-xs leading-relaxed transition-colors ${
                  activeId === item.id
                    ? 'text-cosmic-glow'
                    : 'text-cosmic-frost/40 hover:text-cosmic-frost/70'
                }`}
              >
                {item.text}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
