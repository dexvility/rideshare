'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/app/providers';
import type { AuthMode } from '@/lib/auth-config';
import { isValidPhone } from '@/lib/validate';

type PhoneFlow = 'choose' | 'login' | 'register';
type PasswordFlow = 'login' | 'register' | 'forgot';

const IM_OPTIONS = ['telegram', 'whatsapp', 'signal'] as const;

interface Props {
  authMode: AuthMode;
  googleEnabled: boolean;
  oauthError?: string;
}

export function AuthClient({ authMode, googleEnabled, oauthError }: Props) {
  return authMode === 'phone'
    ? <PhoneAuth />
    : <PasswordAuth googleEnabled={googleEnabled} oauthError={oauthError} />;
}

/* ── Phone mode ──────────────────────────────────────────────── */

function PhoneAuth() {
  const { t } = useLocale();
  const router = useRouter();
  const [flow, setFlow] = useState<PhoneFlow>('choose');
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

  async function submit(body: object) {
    setLoading(true); setError('');
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(t[data.error as keyof typeof t] as string || data.error); return false; }
    return true;
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidPhone(loginPhone)) { setError(t.invalidPhone); return; }
    if (await submit({ action: 'login', phone: loginPhone })) { router.push('/'); router.refresh(); }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidPhone(phone)) { setError(t.invalidPhone); return; }
    if (await submit({
      action: 'register', realName, phone, hasSms, hasTelegram, hasWhatsapp, hasSignal,
      preferredIM: tickedIMs.length > 1 ? preferredIM : tickedIMs[0] || null,
    })) { router.push('/'); router.refresh(); }
  }

  return (
    <AuthShell>
      {flow === 'choose' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display), Georgia, serif', fontSize: '1.3rem', marginBottom: '0.25rem' }}>{t.signIn}</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{t.signInSubtitle}</p>
          <button className="btn-primary" onClick={() => setFlow('login')} style={{ width: '100%', justifyContent: 'center' }}>📱 {t.alreadyHaveAccount}</button>
          <button className="btn-secondary" onClick={() => setFlow('register')} style={{ width: '100%', justifyContent: 'center' }}>✨ {t.newHere}</button>
        </div>
      )}

      {flow === 'login' && (
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <BackHeading onBack={() => { setFlow('choose'); setError(''); }} title={t.loginWithPhone} />
          <Field label={t.phone}>
            <input className="input-base" type="tel" value={loginPhone} onChange={e => setLoginPhone(e.target.value)} required autoFocus />
          </Field>
          <ErrorMsg msg={error} />
          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>{loading ? '…' : t.continueBtn}</button>
        </form>
      )}

      {flow === 'register' && (
        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <BackHeading onBack={() => { setFlow('choose'); setError(''); }} title={t.registerNew} />
          <Field label={`${t.realName} *`}><input className="input-base" value={realName} onChange={e => setRealName(e.target.value)} required autoFocus placeholder={t.placeholderRealName} /></Field>
          <Field label={`${t.phone} *`}><input className="input-base" type="tel" value={phone} onChange={e => setPhone(e.target.value)} required placeholder="+420601234567" /></Field>
          <IMPreferences
            hasSms={hasSms} setHasSms={setHasSms}
            hasTelegram={hasTelegram} setHasTelegram={setHasTelegram}
            hasWhatsapp={hasWhatsapp} setHasWhatsapp={setHasWhatsapp}
            hasSignal={hasSignal} setHasSignal={setHasSignal}
            tickedIMs={tickedIMs} preferredIM={preferredIM} setPreferredIM={setPreferredIM}
          />
          <ErrorMsg msg={error} />
          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: '0.25rem' }}>{loading ? '…' : t.registerNew}</button>
        </form>
      )}
    </AuthShell>
  );
}

/* ── Password mode ───────────────────────────────────────────── */

function PasswordAuth({ googleEnabled, oauthError }: { googleEnabled: boolean; oauthError?: string }) {
  const { t } = useLocale();
  const router = useRouter();
  const [flow, setFlow] = useState<PasswordFlow>('login');
  const [error, setError] = useState(oauthError ? t.oauthFailed : '');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [realName, setRealName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    const res = await fetch('/api/auth/password/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(t[data.error as keyof typeof t] as string || data.error); return; }
    router.push('/'); router.refresh();
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) { setError(t.passwordMismatch); return; }
    setLoading(true); setError('');
    const res = await fetch('/api/auth/password/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, realName }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(t[data.error as keyof typeof t] as string || data.error); return; }
    router.push('/'); router.refresh();
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    setDone(t.resetEmailSent);
  }

  return (
    <AuthShell>
      {flow === 'login' && (
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display), Georgia, serif', fontSize: '1.3rem' }}>{t.signIn}</h2>
          <Field label={t.email}><input className="input-base" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus /></Field>
          <Field label={t.password}><input className="input-base" type="password" value={password} onChange={e => setPassword(e.target.value)} required /></Field>
          <ErrorMsg msg={error} />
          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>{loading ? '…' : t.signIn}</button>
          {googleEnabled && <GoogleButton />}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            <button type="button" className="btn-ghost" style={{ padding: 0 }} onClick={() => { setFlow('register'); setError(''); }}>{t.newHere}</button>
            <button type="button" className="btn-ghost" style={{ padding: 0 }} onClick={() => { setFlow('forgot'); setError(''); }}>{t.forgotPassword}</button>
          </div>
        </form>
      )}

      {flow === 'register' && (
        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <BackHeading onBack={() => { setFlow('login'); setError(''); }} title={t.registerNew} />
          <Field label={`${t.realName} *`}><input className="input-base" value={realName} onChange={e => setRealName(e.target.value)} required autoFocus placeholder={t.placeholderRealName} /></Field>
          <Field label={`${t.email} *`}><input className="input-base" type="email" value={email} onChange={e => setEmail(e.target.value)} required /></Field>
          <Field label={`${t.password} *`}><input className="input-base" type="password" value={password} onChange={e => setPassword(e.target.value)} required /><p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>{t.passwordHint}</p></Field>
          <Field label={`${t.confirmPassword} *`}><input className="input-base" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required /></Field>
          <ErrorMsg msg={error} />
          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>{loading ? '…' : t.registerNew}</button>
          {googleEnabled && <GoogleButton />}
        </form>
      )}

      {flow === 'forgot' && (
        <form onSubmit={handleForgot} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <BackHeading onBack={() => { setFlow('login'); setError(''); setDone(''); }} title={t.forgotPassword} />
          <Field label={t.email}><input className="input-base" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus /></Field>
          {done
            ? <p style={{ color: 'var(--color-success)', fontSize: '0.9rem' }}>{done}</p>
            : <>
                <ErrorMsg msg={error} />
                <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>{loading ? '…' : t.sendResetLink}</button>
              </>
          }
        </form>
      )}
    </AuthShell>
  );
}

/* ── Shared sub-components ───────────────────────────────────── */

function AuthShell({ children }: { children: React.ReactNode }) {
  const { t } = useLocale();
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-background)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>💍</div>
          <h1 style={{ fontFamily: 'var(--font-display), Georgia, serif', fontSize: '2rem', fontWeight: 700, color: 'var(--color-primary)', lineHeight: 1.2 }}>{t.homeTitle}</h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '0.375rem', fontSize: '0.95rem' }}>{t.homeSubtitle}</p>
        </div>
        <div className="card" style={{ padding: '1.75rem' }}>{children}</div>
      </div>
    </div>
  );
}

function BackHeading({ onBack, title }: { onBack: () => void; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
      <button type="button" onClick={onBack} className="btn-ghost" style={{ padding: '0.25rem' }}>←</button>
      <h2 style={{ fontFamily: 'var(--font-display), Georgia, serif', fontSize: '1.25rem' }}>{title}</h2>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem' }}>{label}</label>
      {children}
    </div>
  );
}

function ErrorMsg({ msg }: { msg: string }) {
  if (!msg) return null;
  return <p style={{ color: 'var(--color-error)', fontSize: '0.875rem' }}>{msg}</p>;
}

function GoogleButton() {
  const { t } = useLocale();
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.25rem 0' }}>
        <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{t.orContinueWith}</span>
        <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
      </div>
      <a href="/api/auth/google" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.625rem 1rem', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius)', fontSize: '0.9rem', fontWeight: 500, color: 'var(--color-text)', textDecoration: 'none', background: 'var(--color-surface)' }}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.505 14.01 17.64 11.79 17.64 9.2z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/><path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
        {t.signInWithGoogle}
      </a>
    </>
  );
}

function IMPreferences({ hasSms, setHasSms, hasTelegram, setHasTelegram, hasWhatsapp, setHasWhatsapp, hasSignal, setHasSignal, tickedIMs, preferredIM, setPreferredIM }: any) {
  const { t } = useLocale();
  return (
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
            {tickedIMs.map((im: string) => (
              <label key={im} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                <input type="radio" name="preferredIM" value={im} checked={preferredIM === im} onChange={() => setPreferredIM(im)} />
                {im.charAt(0).toUpperCase() + im.slice(1)}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
