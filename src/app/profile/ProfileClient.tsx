'use client';

import { useState } from 'react';
import { useLocale } from '@/app/providers';
import type { User } from '@prisma/client';
import type { AuthMode } from '@/lib/auth-config';

interface ProfileClientProps {
  user: User;
  authMode: AuthMode;
}

export function ProfileClient({ user: initialUser, authMode }: ProfileClientProps) {
  const { t } = useLocale();
  const [user, setUser] = useState(initialUser);
  const [nickname, setNickname] = useState(user.nickname);
  const [realName, setRealName] = useState(user.realName);
  const [phone, setPhone] = useState(user.phone);
  const [email, setEmail] = useState(user.email || '');
  const [hasSms, setHasSms] = useState(user.hasSms);
  const [hasTelegram, setHasTelegram] = useState(user.hasTelegram);
  const [hasWhatsapp, setHasWhatsapp] = useState(user.hasWhatsapp);
  const [hasSignal, setHasSignal] = useState(user.hasSignal);
  const [preferredIM, setPreferredIM] = useState<string | null>(user.preferredIM);
  const [notifyOffers, setNotifyOffers] = useState(user.notifyOffers);
  const [notifyRequests, setNotifyRequests] = useState(user.notifyRequests);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  const tickedIMs = [
    hasTelegram && 'telegram',
    hasWhatsapp && 'whatsapp',
    hasSignal && 'signal',
  ].filter(Boolean) as string[];

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/users/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nickname, realName, phone, email,
        hasSms, hasTelegram, hasWhatsapp, hasSignal,
        preferredIM: tickedIMs.length > 1 ? preferredIM : tickedIMs[0] || null,
        notifyOffers, notifyRequests,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(t[data.error as keyof typeof t] as string || data.error);
      return;
    }

    setUser(data);
    showToast(t.saved);
  }

  return (
    <div style={{ maxWidth: '560px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      <h1 style={{
        fontFamily: 'var(--font-display), Georgia, serif',
        fontSize: '1.8rem',
        fontWeight: 700,
        color: 'var(--color-primary)',
        marginBottom: '0.25rem',
      }}>
        {t.myProfile}
      </h1>
      <div className="accent-line" />

      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
          ID: <code style={{ fontSize: '0.75rem' }}>{user.id.slice(0, 8)}…</code>
        </p>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem' }}>{t.nickname}</label>
            <input className="input-base" value={nickname} onChange={e => setNickname(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem' }}>{t.realName}</label>
            <input className="input-base" value={realName} onChange={e => setRealName(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem' }}>{t.phone}</label>
            <input className="input-base" type="tel" value={phone} onChange={e => setPhone(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem' }}>{t.email}</label>
            <input className="input-base" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t.placeholderEmail} />
          </div>

          {/* Messenger preferences */}
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
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  {tickedIMs.map(im => (
                    <label key={im} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                      <input type="radio" name="preferredIM" checked={preferredIM === im} onChange={() => setPreferredIM(im)} />
                      {im.charAt(0).toUpperCase() + im.slice(1)}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Notification settings */}
          <div style={{ paddingTop: '0.5rem', borderTop: '1px solid var(--color-border)' }}>
            <p style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>🔔 {t.notificationSettings}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={notifyOffers} onChange={e => setNotifyOffers(e.target.checked)} style={{ width: '1rem', height: '1rem' }} />
                {t.subscribeOffers}
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={notifyRequests} onChange={e => setNotifyRequests(e.target.checked)} style={{ width: '1rem', height: '1rem' }} />
                {t.subscribeRequests}
              </label>
            </div>

            <div style={{ marginTop: '0.875rem', padding: '0.875rem', background: 'color-mix(in srgb, var(--color-accent) 12%, transparent)', borderRadius: 'calc(var(--border-radius) * 0.75)', fontSize: '0.82rem' }}>
              <p style={{ marginBottom: '0.375rem' }}>{t.ntfyInfo}</p>
              <p>{t.ntfyTopicOffers} <code style={{ background: 'rgba(0,0,0,0.06)', padding: '0.1rem 0.35rem', borderRadius: '0.25rem' }}>svatba-jizdy-nabidky</code></p>
              <p style={{ marginTop: '0.2rem' }}>{t.ntfyTopicRequests} <code style={{ background: 'rgba(0,0,0,0.06)', padding: '0.1rem 0.35rem', borderRadius: '0.25rem' }}>svatba-jizdy-poptavky</code></p>
              <a href="https://ntfy.sh" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: '0.5rem', color: 'var(--color-primary)', fontWeight: 500 }}>
                ↗ {t.downloadNtfy}
              </a>
            </div>
          </div>

          {error && <p style={{ color: 'var(--color-error)', fontSize: '0.875rem' }}>{error}</p>}

          <button type="submit" className="btn-primary" disabled={loading} style={{ alignSelf: 'flex-start' }}>
            {loading ? '…' : t.save}
          </button>
        </form>
      </div>

      {toast && <div className="toast">{toast}</div>}

      {authMode === 'password' && (
        <ChangePasswordSection hasPassword={!!initialUser.passwordHash} />
      )}
    </div>
  );
}

function ChangePasswordSection({ hasPassword }: { hasPassword: boolean }) {
  const { t } = useLocale();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (next !== confirm) { setError(t.passwordMismatch); return; }
    setLoading(true); setError('');
    const res = await fetch('/api/auth/password/change', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: current, newPassword: next }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(t[data.error as keyof typeof t] as string || data.error); return; }
    setCurrent(''); setNext(''); setConfirm('');
    showToast(t.saved);
  }

  return (
    <div className="card" style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
      <h2 style={{ fontFamily: 'var(--font-display), Georgia, serif', fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>
        🔑 {t.changePassword}
      </h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        {hasPassword && (
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem' }}>{t.currentPassword}</label>
            <input className="input-base" type="password" value={current} onChange={e => setCurrent(e.target.value)} required />
          </div>
        )}
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem' }}>{t.newPassword}</label>
          <input className="input-base" type="password" value={next} onChange={e => setNext(e.target.value)} required />
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>{t.passwordHint}</p>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem' }}>{t.confirmPassword}</label>
          <input className="input-base" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
        </div>
        {error && <p style={{ color: 'var(--color-error)', fontSize: '0.875rem' }}>{error}</p>}
        <button type="submit" className="btn-primary" disabled={loading} style={{ alignSelf: 'flex-start' }}>
          {loading ? '…' : t.changePassword}
        </button>
      </form>
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
