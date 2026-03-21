'use client';

import { useMemo } from 'react';
import { avatarToDataUrl } from '@/utils/avatarGenerator';

interface CosmicAvatarProps {
  avatarSeed: string;
  size?: number;
  className?: string;
}

export default function CosmicAvatar({ avatarSeed, size = 40, className }: CosmicAvatarProps) {
  const src = useMemo(() => avatarToDataUrl(avatarSeed, size), [avatarSeed, size]);

  return (
    <img
      src={src}
      alt="avatar"
      width={size}
      height={size}
      className={className}
      style={{ borderRadius: '20%' }}
    />
  );
}
