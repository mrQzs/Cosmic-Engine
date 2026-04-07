'use client';

import Link from 'next/link';
import { useMemo } from 'react';

interface Article {
  slug: string;
  title: string;
  excerpt?: string;
  galaxyName?: string;
}

interface FlatCosmicViewProps {
  articles?: Article[];
}

/** 2D fallback view for devices without WebGL2 support. */
export default function FlatCosmicView({ articles = [] }: FlatCosmicViewProps) {
  const stars = useMemo(() => {
    return Array.from({ length: 100 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 2 + 1,
      delay: `${Math.random() * 5}s`,
      duration: `${2 + Math.random() * 3}s`,
    }));
  }, []);

  return (
    <div className="relative min-h-screen overflow-auto bg-[radial-gradient(ellipse_at_center,#0b0d17_0%,#05050f_50%,#0a0a1a_100%)]">
      {/* CSS animated stars */}
      <div className="pointer-events-none fixed inset-0 z-0">
        {stars.map((star) => (
          <span
            key={star.id}
            className="absolute rounded-full bg-white animate-twinkle"
            style={{
              left: star.left,
              top: star.top,
              width: star.size,
              height: star.size,
              animationDelay: star.delay,
              animationDuration: star.duration,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 py-12 text-center">
        <h1 className="font-heading text-4xl font-bold tracking-wider text-cosmic-frost">
          CyberGeek
        </h1>
        <p className="mt-2 font-mono text-sm text-cosmic-glow/70">Cosmic Blog — 2D Mode</p>
      </header>

      {/* Article cards grid */}
      <main className="relative z-10 mx-auto max-w-5xl px-4 pb-16">
        {articles.length === 0 ? (
          <p className="text-center font-mono text-sm text-cosmic-frost/50">
            No articles found in this sector.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <Link
                key={article.slug}
                href={`/post/${article.slug}`}
                className="group rounded-lg border border-cosmic-glow/20 bg-cosmic-void/60 p-5 backdrop-blur-sm transition-all hover:border-cosmic-glow/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)]"
              >
                {article.galaxyName && (
                  <span className="mb-2 inline-block font-mono text-xs uppercase tracking-wider text-cosmic-glow/50">
                    {article.galaxyName}
                  </span>
                )}
                <h2 className="font-heading text-lg font-semibold text-cosmic-frost transition-colors group-hover:text-cosmic-glow">
                  {article.title}
                </h2>
                {article.excerpt && (
                  <p className="mt-2 line-clamp-3 text-sm text-cosmic-frost/60">
                    {article.excerpt}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
