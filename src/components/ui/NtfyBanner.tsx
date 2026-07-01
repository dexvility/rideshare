'use client';

import { useState, useEffect } from 'react';
import { useLocale } from '@/app/providers';
import Link from 'next/link';

export function NtfyBanner() {
  const { t } = useLocale();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('ntfy-dismissed')) setShow(true);
  }, []);

  function dismiss() {
    setShow(false);
    localStorage.setItem('ntfy-dismissed', '1');
  }

  if (!show) return null;

  return (
    <div
      style={{
        background: 'color-mix(in srgb, var(--color-primary) 12%, var(--color-accent))',
        color: '#1A1A1A',
        padding: '0.625rem 1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        fontSize: '0.875rem',
        flexWrap: 'wrap',
      }}
    >
      <span style={{ flex: 1 }}>🔔 {t.ntfyBannerText}</span>
      <Link
        href="/profile"
        onClick={dismiss}
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
          textDecoration: 'none',
        }}
      >
        {t.ntfyBannerCta}
      </Link>
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
