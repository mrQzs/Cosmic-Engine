'use client';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import Link from 'next/link';
import AuthorCard from './AuthorCard';

dayjs.extend(relativeTime);

interface Tag {
  id: string;
  name: string;
  slug: string;
  color: string;
}

interface ArticleMetaProps {
  title: string;
  publishedAt?: string | null;
  updatedAt?: string | null;
  readingTime: number;
  viewCount: number;
  tags: Tag[];
  galaxyName?: string | null;
  galaxySlug?: string | null;
  content: string;
}

export function ArticleHeader({
  title,
  publishedAt,
  readingTime,
  viewCount,
  tags,
  galaxyName,
  galaxySlug,
  content,
}: ArticleMetaProps) {
  const wordCount = content.split(/\s+/).length;
  const published = publishedAt ? dayjs(publishedAt) : null;

  return (
    <header className="mb-8 border-b border-cosmic-frost/10 pb-8">
      <h1 className="font-heading text-3xl leading-tight text-cosmic-frost md:text-4xl">{title}</h1>

      <div className="mt-4 flex flex-wrap items-center gap-3 font-mono text-xs text-cosmic-frost/50">
        {published && (
          <time dateTime={published.toISOString()} title={published.format('YYYY-MM-DD HH:mm')}>
            {published.fromNow()}
          </time>
        )}
        <span>{wordCount} words</span>
        <span>{readingTime} min read</span>
        <span>{viewCount} views</span>
        {galaxyName && galaxySlug && (
          <Link
            href={`/galaxy/${galaxySlug}`}
            className="text-cosmic-glow/70 hover:text-cosmic-glow"
          >
            {galaxyName}
          </Link>
        )}
      </div>

      {tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag.id}
              className="rounded-full border px-2.5 py-0.5 font-mono text-xs"
              style={{
                borderColor: `${tag.color}40`,
                color: tag.color,
                backgroundColor: `${tag.color}10`,
              }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}
    </header>
  );
}

export function ArticleFooter({ updatedAt, tags }: Pick<ArticleMetaProps, 'updatedAt' | 'tags'>) {
  const updated = updatedAt ? dayjs(updatedAt) : null;

  return (
    <footer className="mt-12 border-t border-cosmic-frost/10 pt-8">
      <AuthorCard />

      <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-cosmic-frost/40">
        {updated && <span>Updated {updated.format('YYYY-MM-DD')}</span>}
        <span>CC BY-NC-SA 4.0</span>
      </div>

      {tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag.id}
              className="rounded-full border border-cosmic-frost/10 px-2 py-0.5 font-mono text-xs text-cosmic-frost/50"
            >
              #{tag.name}
            </span>
          ))}
        </div>
      )}
    </footer>
  );
}
