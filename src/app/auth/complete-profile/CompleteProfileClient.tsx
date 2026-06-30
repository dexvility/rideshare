'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/app/providers';
import { isValidPhone } from '@/lib/validate';

export function CompleteProfileClient() {
  const { t } = useLocale();
  const router = useRouter();
  const [phone, setPhone] = useState('+420');
  const [hasSms, setHasSms] = useState(false);
  const [hasTelegram, setHasTelegram] = useState(false);
  const [hasWhatsapp, setHasWhatsapp] = useState(false);
  const [hasSignal, setHasSignal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidPhone(phone)) { setError(t.invalidPhone); return; }
    setLoading(true); setError('');

    const res = await fetch('/api/users/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, hasSms, hasTelegram, hasWhatsapp, hasSignal, profileComplete: true }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) { setError(t[data.error as keyof typeof t] as string || data.error); return; }
    router.push('/');
    router.refresh();
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div className="card" style={{ padding: '1.75rem' }}>
          <h1 style={{ fontFamily: 'var(--font-display), Georgia, serif', fontSize: '1.4rem', color: 'var(--color-primary)', marginBottom: '0.25rem' }}>{t.completeProfile}</h1>
          <div className="accent-line" />
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', margin: '0.75rem 0 1.25rem' }}>{t.completeProfileSubtitle}</p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem' }}>{t.phone} *</label>
              <input className="input-base" type="tel" value={phone} onChange={e => setPhone(e.target.value)} required autoFocus placeholder="+420601234567" />
            </div>

            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>{t.contactPreferences}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                {[
                  { key: 'sms', label: t.sms, val: hasSms, set: setHasSms },
                  { key: 'telegram', label: t.telegram, val: hasTelegram, set: setHasTelegram },
                  { key: 'whatsapp', label: t.whatsapp, val: hasWhatsapp, set: setHasWhatsapp },
                  { key: 'signal', label: t.signal, val: hasSignal, set: setHasSignal },
                ].map(({ key, label, val, set }) => (
                  <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={val} onChange={e => set(e.target.checked)} style={{ width: '1rem', height: '1rem' }} />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            {error && <p style={{ color: 'var(--color-error)', fontSize: '0.875rem' }}>{error}</p>}
            <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>{loading ? '…' : t.continueBtn}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
