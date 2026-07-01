'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function ModalShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') router.back(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [router]);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.55)',
        overflowY: 'auto',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '2rem 1rem',
      }}
      onClick={e => { if (e.target === e.currentTarget) router.back(); }}
    >
      <div
        style={{
          background: 'var(--color-surface)',
          borderRadius: 'var(--border-radius)',
          width: '100%',
          maxWidth: '640px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.25)',
          padding: '1.5rem',
        }}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
