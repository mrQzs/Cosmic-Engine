'use client';

import { useEffect, useCallback, useRef, useState } from 'react';

interface LightboxImage {
  src: string;
  alt: string;
}

interface ImageLightboxProps {
  images: LightboxImage[];
  initialIndex: number;
  onClose: () => void;
}

export default function ImageLightbox({ images, initialIndex, onClose }: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const current = images[currentIndex];

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          setCurrentIndex((i) => (i > 0 ? i - 1 : images.length - 1));
          setZoom(1);
          setPan({ x: 0, y: 0 });
          break;
        case 'ArrowRight':
          setCurrentIndex((i) => (i < images.length - 1 ? i + 1 : 0));
          setZoom(1);
          setPan({ x: 0, y: 0 });
          break;
      }
    },
    [images.length, onClose],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => Math.max(0.5, Math.min(5, z - e.deltaY * 0.002)));
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      isDragging.current = true;
      dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    },
    [pan],
  );

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    setPan({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  }, []);

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-cosmic-void/95 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-10 rounded-full border border-cosmic-frost/20 bg-cosmic-void/60 p-2 font-mono text-sm text-cosmic-frost/60 hover:text-cosmic-frost"
      >
        ESC
      </button>

      {/* Navigation arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIndex((i) => (i > 0 ? i - 1 : images.length - 1));
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full border border-cosmic-frost/20 bg-cosmic-void/60 px-3 py-2 text-cosmic-frost/60 hover:text-cosmic-frost"
          >
            ←
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIndex((i) => (i < images.length - 1 ? i + 1 : 0));
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full border border-cosmic-frost/20 bg-cosmic-void/60 px-3 py-2 text-cosmic-frost/60 hover:text-cosmic-frost"
          >
            →
          </button>
        </>
      )}

      {/* Image */}
      <div
        className="max-h-[90vh] max-w-[90vw] cursor-grab active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <img
          src={current.src}
          alt={current.alt}
          className="max-h-[85vh] max-w-full select-none object-contain"
          style={{
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            transition: isDragging.current ? 'none' : 'transform 0.15s ease-out',
          }}
          draggable={false}
        />
      </div>

      {/* Caption + counter */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center">
        {current.alt && <p className="text-sm text-cosmic-frost/70">{current.alt}</p>}
        {images.length > 1 && (
          <p className="mt-1 font-mono text-xs text-cosmic-frost/40">
            {currentIndex + 1} / {images.length}
          </p>
        )}
      </div>
    </div>
  );
}
