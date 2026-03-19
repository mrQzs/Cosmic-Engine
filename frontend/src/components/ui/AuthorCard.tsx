'use client';

import Link from 'next/link';

interface AuthorCardProps {
  name?: string;
  bio?: string;
  avatarUrl?: string;
}

export default function AuthorCard({
  name = 'CyberGeek',
  bio = 'Explorer of the digital cosmos.',
  avatarUrl,
}: AuthorCardProps) {
  return (
    <Link href="/about" className="group block">
      <div className="flex items-center gap-4 rounded-lg border border-cosmic-frost/10 bg-cosmic-void/40 p-4 backdrop-blur-sm transition-colors hover:border-cosmic-glow/30">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-cosmic-glow/20 font-heading text-lg text-cosmic-glow">
          {avatarUrl ? (
            <img src={avatarUrl} alt={name} className="h-full w-full rounded-full object-cover" />
          ) : (
            name.charAt(0).toUpperCase()
          )}
        </div>
        <div>
          <p className="font-heading text-sm text-cosmic-frost group-hover:text-cosmic-glow">
            {name}
          </p>
          <p className="text-xs text-cosmic-frost/50">{bio}</p>
        </div>
      </div>
    </Link>
  );
}
