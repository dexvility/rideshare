'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    if (!res.ok) { setError('Nesprávný token.'); return; }
    router.push('/admin');
    router.refresh();
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div className="card" style={{ padding: '2rem', width: '100%', maxWidth: '360px' }}>
        <h1 style={{ fontFamily: 'var(--font-display), Georgia, serif', fontSize: '1.5rem', marginBottom: '1.25rem' }}>
          ⚙️ Admin
        </h1>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem' }}>Admin token</label>
            <input className="input-base" type="password" value={token} onChange={e => setToken(e.target.value)} required autoFocus />
          </div>
          {error && <p style={{ color: 'var(--color-error)', fontSize: '0.875rem' }}>{error}</p>}
          <button type="submit" className="btn-primary">Přihlásit se</button>
        </form>
      </div>
    </div>
  );
}
