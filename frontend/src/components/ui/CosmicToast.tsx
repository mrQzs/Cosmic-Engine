'use client';

import { useEffect, useState } from 'react';

interface CosmicToastProps {
  message: string;
  visible: boolean;
  onDismiss: () => void;
  duration?: number;
}

export default function CosmicToast({
  message,
  visible,
  onDismiss,
  duration = 3000,
}: CosmicToastProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        setTimeout(onDismiss, 300); // Wait for fade-out
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onDismiss]);

  if (!visible && !show) return null;

  return (
    <div
      className={`fixed bottom-8 left-1/2 z-[100] -translate-x-1/2 rounded-lg border border-cosmic-glow/30 bg-cosmic-void/90 px-4 py-2 font-mono text-sm text-cosmic-glow backdrop-blur-sm transition-all duration-300 ${
        show ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
    >
      {message}
    </div>
  );
}
