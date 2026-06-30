'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale } from '@/app/providers';
import { Suspense } from 'react';

function ResetPasswordInner() {
  const { t } = useLocale();
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError(t.passwordMismatch); return; }
    setLoading(true); setError('');

    const res = await fetch('/api/auth/reset-password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword: password }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) { setError(t[data.error as keyof typeof t] as string || data.error); return; }
    setDone(true);
    setTimeout(() => router.push('/auth'), 2500);
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="card" style={{ maxWidth: '420px', width: '100%', padding: '2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-display), Georgia, serif', fontSize: '1.5rem', color: 'var(--color-primary)', marginBottom: '1.25rem' }}>{t.resetPassword}</h1>

        {done ? (
          <p style={{ color: 'var(--color-success)', fontSize: '0.95rem' }}>{t.passwordResetDone}</p>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem' }}>{t.newPassword}</label>
              <input className="input-base" type="password" value={password} onChange={e => setPassword(e.target.value)} required autoFocus />
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>{t.passwordHint}</p>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem' }}>{t.confirmPassword}</label>
              <input className="input-base" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
            </div>
            {error && <p style={{ color: 'var(--color-error)', fontSize: '0.875rem' }}>{error}</p>}
            <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>{loading ? '…' : t.resetPassword}</button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return <Suspense><ResetPasswordInner /></Suspense>;
}
