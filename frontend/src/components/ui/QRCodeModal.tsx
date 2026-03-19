'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface QRCodeModalProps {
  url: string;
  onClose: () => void;
}

export default function QRCodeModal({ url, onClose }: QRCodeModalProps) {
  const [svgData, setSvgData] = useState('');

  useEffect(() => {
    QRCode.toString(url, {
      type: 'svg',
      color: {
        dark: '#06b6d4',
        light: '#0a0a1a',
      },
      margin: 2,
      width: 200,
    }).then(setSvgData);
  }, [url]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-cosmic-void/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="hud-panel p-6 text-center" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-4 font-mono text-sm text-cosmic-glow">Scan to share</h3>
        <div className="mx-auto w-[200px]" dangerouslySetInnerHTML={{ __html: svgData }} />
        <p className="mt-4 max-w-[200px] break-all font-mono text-xs text-cosmic-frost/40">{url}</p>
        <button
          onClick={onClose}
          className="mt-4 rounded border border-cosmic-frost/20 px-3 py-1 font-mono text-xs text-cosmic-frost/60 hover:text-cosmic-frost"
        >
          Close
        </button>
      </div>
    </div>
  );
}
