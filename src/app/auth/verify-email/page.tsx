'use client';

import { useLocale } from '@/app/providers';
import Link from 'next/link';

export default function VerifyEmailPage() {
  const { t } = useLocale();
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📧</div>
        <h1 style={{ fontFamily: 'var(--font-display), Georgia, serif', fontSize: '1.5rem', color: 'var(--color-primary)', marginBottom: '0.75rem' }}>{t.checkYourEmail}</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', lineHeight: 1.6 }}>{t.verifyEmailSent}</p>
        <Link href="/" style={{ display: 'inline-block', marginTop: '1.5rem', color: 'var(--color-primary)', fontSize: '0.9rem' }}>← {t.backToHome}</Link>
      </div>
    </div>
  );
}
