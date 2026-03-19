'use client';

import { useEffect, useCallback, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { useRouter } from 'next/navigation';
import { markdownComponents } from './markdown';
import { remarkPlugins, rehypePlugins } from '@/utils/remarkPlugins';
import { ArticleHeader, ArticleFooter } from './ArticleMeta';
import ReadingProgress from './ReadingProgress';
import TableOfContents from './TableOfContents';
import ArticleNavigation from './ArticleNavigation';
import ShareBar from './ShareBar';
import { useReadingProgress } from '@/hooks/useReadingProgress';

interface PlanetData {
  title: string;
  slug: string;
  content: string;
  readingTime: number;
  viewCount: number;
  publishedAt?: string | null;
  updatedAt?: string | null;
  tags: { id: string; name: string; slug: string; color: string }[];
  galaxy?: { name: string; slug: string } | null;
  relatedPlanets?: {
    id: string;
    title: string;
    slug: string;
    excerpt?: string | null;
    aestheticsParams?: { baseColorHSL: { h: number; s: number; l: number } };
  }[];
}

interface ArticleReaderProps {
  planet: PlanetData;
}

export default function ArticleReader({ planet }: ArticleReaderProps) {
  const router = useRouter();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { progress, isComplete } = useReadingProgress(scrollContainerRef);

  // ESC to exit
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        router.back();
      }
    },
    [router],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end overflow-hidden">
      <ReadingProgress progress={progress} isComplete={isComplete} />
      <TableOfContents containerRef={scrollContainerRef} />
      <ShareBar title={planet.title} slug={planet.slug} />

      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-cosmic-void/60 backdrop-blur-sm"
        onClick={() => router.back()}
      />

      {/* Article panel */}
      <div
        ref={scrollContainerRef}
        className="relative z-10 h-full w-full max-w-3xl overflow-y-auto border-l border-cosmic-frost/10 bg-cosmic-void/90 backdrop-blur-md"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(6,182,212,0.3) transparent',
        }}
      >
        <div className="mx-auto max-w-2xl px-6 py-12 md:px-10">
          <ArticleHeader
            title={planet.title}
            publishedAt={planet.publishedAt}
            updatedAt={planet.updatedAt}
            readingTime={planet.readingTime}
            viewCount={planet.viewCount}
            tags={planet.tags}
            galaxyName={planet.galaxy?.name}
            galaxySlug={planet.galaxy?.slug}
            content={planet.content}
          />

          {/* Markdown content */}
          <article className="prose-cosmic">
            <ReactMarkdown
              remarkPlugins={remarkPlugins}
              rehypePlugins={rehypePlugins}
              components={markdownComponents}
              // Security: strip raw HTML (react-markdown uses AST, not dangerouslySetInnerHTML)
              skipHtml
            >
              {planet.content}
            </ReactMarkdown>
          </article>

          <ArticleNavigation relatedPlanets={planet.relatedPlanets} />

          <ArticleFooter updatedAt={planet.updatedAt} tags={planet.tags} />
        </div>
      </div>
    </div>
  );
}
