'use client';

interface ImageRendererProps {
  src?: string;
  alt?: string;
  onImageClick?: (src: string, alt: string) => void;
}

export default function ImageRenderer({ src, alt, onImageClick }: ImageRendererProps) {
  // Reject javascript: protocol
  if (src && /^javascript:/i.test(src)) return null;

  return (
    <figure className="my-6">
      <img
        src={src}
        alt={alt ?? ''}
        loading="lazy"
        className="max-w-full cursor-zoom-in rounded-lg border border-cosmic-frost/10 transition-transform hover:scale-[1.02]"
        onClick={() => src && onImageClick?.(src, alt ?? '')}
      />
      {alt && (
        <figcaption className="mt-2 text-center text-sm text-cosmic-frost/50">{alt}</figcaption>
      )}
    </figure>
  );
}
