// src/app/auth/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/app/providers';

type Mode = 'choose' | 'login' | 'register';
const IM_OPTIONS = ['telegram', 'whatsapp', 'signal'] as const;

export default function AuthPage() {
  const { t } = useLocale();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('choose');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [loginPhone, setLoginPhone] = useState('+420');

  const [realName, setRealName] = useState('');
  const [phone, setPhone] = useState('+420');
  const [hasSms, setHasSms] = useState(false);
  const [hasTelegram, setHasTelegram] = useState(false);
  const [hasWhatsapp, setHasWhatsapp] = useState(false);
  const [hasSignal, setHasSignal] = useState(false);
  const [preferredIM, setPreferredIM] = useState<string | null>(null);

  const tickedIMs = [
    hasTelegram && 'telegram',
    hasWhatsapp && 'whatsapp',
    hasSignal && 'signal',
  ].filter(Boolean) as string[];

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', phone: loginPhone }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(t[data.error as keyof typeof t] as string || data.error);
      return;
    }
    router.push('/');
    router.refresh();
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'register',
        realName, phone,
        hasSms, hasTelegram, hasWhatsapp, hasSignal,
        preferredIM: tickedIMs.length > 1 ? preferredIM : tickedIMs[0] || null,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(t[data.error as keyof typeof t] as string || data.error);
      return;
    }
    router.push('/');
    router.refresh();
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-background)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>💍</div>
          <h1 style={{
            fontFamily: 'var(--font-display), Georgia, serif',
            fontSize: '2rem',
            fontWeight: 700,
            color: 'var(--color-primary)',
            lineHeight: 1.2,
          }}>
            {t.homeTitle}
          </h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '0.375rem', fontSize: '0.95rem' }}>
            {t.homeSubtitle}
          </p>
        </div>

        <div className="card" style={{ padding: '1.75rem' }}>
          {mode === 'choose' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display), Georgia, serif', fontSize: '1.3rem', marginBottom: '0.25rem' }}>
                {t.signIn}
              </h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                {t.signInSubtitle}
              </p>
              <button className="btn-primary" onClick={() => setMode('login')} style={{ width: '100%', justifyContent: 'center' }}>
                📱 {t.alreadyHaveAccount}
              </button>
              <button className="btn-secondary" onClick={() => setMode('register')} style={{ width: '100%', justifyContent: 'center' }}>
                ✨ {t.newHere}
              </button>
            </div>
          )}

          {mode === 'login' && (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <button type="button" onClick={() => { setMode('choose'); setError(''); }} className="btn-ghost" style={{ padding: '0.25rem' }}>←</button>
                <h2 style={{ fontFamily: 'var(--font-display), Georgia, serif', fontSize: '1.25rem' }}>{t.loginWithPhone}</h2>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem' }}>{t.phone}</label>
                <input
                  className="input-base"
                  type="tel"
                  value={loginPhone}
                  onChange={e => setLoginPhone(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              {error && <p style={{ color: 'var(--color-error)', fontSize: '0.875rem' }}>{error}</p>}
              <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                {loading ? '…' : t.continueBtn}
              </button>
            </form>
          )}

          {mode === 'register' && (
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <button type="button" onClick={() => { setMode('choose'); setError(''); }} className="btn-ghost" style={{ padding: '0.25rem' }}>←</button>
                <h2 style={{ fontFamily: 'var(--font-display), Georgia, serif', fontSize: '1.25rem' }}>{t.registerNew}</h2>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem' }}>{t.realName} *</label>
                <input className="input-base" value={realName} onChange={e => setRealName(e.target.value)} required autoFocus placeholder={t.placeholderRealName} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem' }}>{t.phone} *</label>
                <input className="input-base" type="tel" value={phone} onChange={e => setPhone(e.target.value)} required placeholder="+420601234567" />
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

                {tickedIMs.length > 1 && (
                  <div style={{ marginTop: '0.625rem', padding: '0.75rem', background: 'var(--color-background)', borderRadius: 'calc(var(--border-radius) * 0.75)', border: '1px solid var(--color-border)' }}>
                    <p style={{ fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.375rem' }}>{t.preferredMessenger}</p>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      {tickedIMs.map(im => (
                        <label key={im} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                          <input type="radio" name="preferredIM" value={im} checked={preferredIM === im} onChange={() => setPreferredIM(im)} />
                          {im.charAt(0).toUpperCase() + im.slice(1)}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ padding: '0.875rem', background: 'color-mix(in srgb, var(--color-accent) 12%, transparent)', borderRadius: 'calc(var(--border-radius) * 0.75)', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                <p style={{ fontWeight: 600, marginBottom: '0.375rem', color: 'var(--color-text)' }}>🔔 {t.notificationSettings}</p>
                <p>{t.ntfyInfo}</p>
                <p style={{ marginTop: '0.375rem' }}>{t.ntfyTopicOffers} <code style={{ background: 'rgba(0,0,0,0.06)', padding: '0.1rem 0.35rem', borderRadius: '0.25rem' }}>svatba-jizdy-nabidky</code></p>
                <p style={{ marginTop: '0.2rem' }}>{t.ntfyTopicRequests} <code style={{ background: 'rgba(0,0,0,0.06)', padding: '0.1rem 0.35rem', borderRadius: '0.25rem' }}>svatba-jizdy-poptavky</code></p>
                <a href="https://ntfy.sh" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: '0.5rem', color: 'var(--color-primary)', fontWeight: 500 }}>
                  ↗ {t.downloadNtfy}
                </a>
              </div>

              {error && <p style={{ color: 'var(--color-error)', fontSize: '0.875rem' }}>{error}</p>}

              <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: '0.25rem' }}>
                {loading ? '…' : t.registerNew}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
