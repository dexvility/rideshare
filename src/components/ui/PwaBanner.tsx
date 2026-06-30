'use client';

import { useState, useEffect } from 'react';
import { useLocale } from '@/app/providers';

type Platform = 'ios' | 'android' | 'desktop' | 'other';

function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'other';
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
  if (/android/i.test(ua)) return 'android';
  if (/macintosh|windows|linux/i.test(ua)) return 'desktop';
  return 'other';
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (window.navigator as any).standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches;
}

export function PwaBanner() {
  const { t } = useLocale();
  const [show, setShow] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [platform, setPlatform] = useState<Platform>('other');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    if (isStandalone()) return;
    if (localStorage.getItem('pwa-dismissed')) return;

    const p = detectPlatform();
    setPlatform(p);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    setShow(true);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  function dismiss() {
    setShow(false);
    localStorage.setItem('pwa-dismissed', '1');
  }

  async function handleInstall() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') dismiss();
    } else {
      setShowSteps(true);
    }
  }

  if (!show) return null;

  return (
    <div
      style={{
        background: 'var(--color-accent)',
        color: '#1A1A1A',
        padding: '0.625rem 1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        fontSize: '0.875rem',
        flexWrap: 'wrap',
      }}
    >
      <span style={{ flex: 1 }}>
        📲 {t.pwaText}
        {showSteps && (
          <span style={{ display: 'block', marginTop: '0.25rem', fontSize: '0.8rem', opacity: 0.85 }}>
            {platform === 'ios' ? t.pwaIosSteps : platform === 'android' ? t.pwaAndroidSteps : t.pwaIosSteps + ' / ' + t.pwaAndroidSteps}
          </span>
        )}
      </span>
      <button
        onClick={handleInstall}
        style={{
          background: '#1A1A1A',
          color: '#fff',
          border: 'none',
          borderRadius: '0.5rem',
          padding: '0.375rem 0.875rem',
          fontWeight: 600,
          fontSize: '0.8rem',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        {t.pwaInstall}
      </button>
      <button
        onClick={dismiss}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '1.1rem',
          padding: '0.25rem',
          opacity: 0.6,
        }}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
