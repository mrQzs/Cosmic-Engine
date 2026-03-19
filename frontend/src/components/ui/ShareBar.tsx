'use client';

import { useState, useCallback } from 'react';
import CosmicToast from './CosmicToast';
import QRCodeModal from './QRCodeModal';

interface ShareBarProps {
  title: string;
  slug: string;
}

export default function ShareBar({ title, slug }: ShareBarProps) {
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showQR, setShowQR] = useState(false);

  const url =
    typeof window !== 'undefined'
      ? `${window.location.origin}/post/${slug}`
      : `https://wo.city/post/${slug}`;

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setToastVisible(true);
  }, []);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      showToast('Link copied!');
    } catch {
      showToast('Failed to copy');
    }
  }, [url, showToast]);

  const handleTwitter = useCallback(() => {
    const tweetUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
    window.open(tweetUrl, '_blank', 'noopener,noreferrer');
  }, [title, url]);

  const handleWeibo = useCallback(() => {
    const weiboUrl = `https://service.weibo.com/share/share.php?title=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
    window.open(weiboUrl, '_blank', 'noopener,noreferrer');
  }, [title, url]);

  const handleWebShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // User cancelled
      }
    }
  }, [title, url]);

  return (
    <>
      <div className="fixed left-4 top-1/2 z-[55] -translate-y-1/2">
        <div className="flex flex-col gap-2 rounded-lg border border-cosmic-frost/10 bg-cosmic-void/80 p-2 backdrop-blur-sm">
          <ShareButton label="Copy" icon="🔗" onClick={handleCopyLink} />
          <ShareButton label="X" icon="𝕏" onClick={handleTwitter} />
          <ShareButton label="WeChat" icon="微" onClick={() => setShowQR(true)} />
          <ShareButton label="Weibo" icon="微博" onClick={handleWeibo} />
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <ShareButton label="Share" icon="↗" onClick={handleWebShare} />
          )}
        </div>
      </div>

      {showQR && <QRCodeModal url={url} onClose={() => setShowQR(false)} />}

      <CosmicToast
        message={toastMessage}
        visible={toastVisible}
        onDismiss={() => setToastVisible(false)}
      />
    </>
  );
}

function ShareButton({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className="flex h-8 w-8 items-center justify-center rounded text-xs text-cosmic-frost/50 transition-colors hover:bg-cosmic-frost/10 hover:text-cosmic-glow"
    >
      {icon}
    </button>
  );
}
