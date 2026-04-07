import Link from 'next/link';
import ClientCanvas from '@/components/canvas/ClientCanvas';

/**
 * Home page — Server Component.
 * The SEO semantic layer is rendered server-side for crawlers.
 * The 3D/2D canvas is rendered client-side via ClientCanvas.
 */
export default function Home() {
  return (
    <main className="h-screen w-screen">
      {/* SEO hidden semantic layer — server-rendered for crawlers */}
      <article className="sr-only">
        <h1>CyberGeek — Cosmic Blog</h1>
        <p>
          An immersive 3D space-themed blog where articles are planets, comments are satellites, and
          categories are galaxies. Explore the universe of technology, code, and ideas.
        </p>
        <nav aria-label="Main navigation">
          <ul>
            <li>
              <Link href="/">Universe Panorama</Link>
            </li>
            <li>
              <Link href="/about">About the Author</Link>
            </li>
          </ul>
        </nav>
      </article>

      {/* 3D canvas or 2D fallback — client-rendered */}
      <ClientCanvas />
    </main>
  );
}
