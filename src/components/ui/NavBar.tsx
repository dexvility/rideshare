'use client';

import { useLocale } from '@/app/providers';
import Link from 'next/link';
import { useState } from 'react';
import type { User } from '@prisma/client';

interface NavBarProps {
  user: User | null;
  appName: string;
  heroEmoji: string;
}

export function NavBar({ user, appName, heroEmoji }: NavBarProps) {
  const { t, locale, setLocale } = useLocale();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header
      style={{
        background: 'var(--color-primary)',
        color: '#fff',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 1px 8px rgba(0,0,0,0.18)',
      }}
    >
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span style={{ fontSize: '1.25rem' }}>{heroEmoji}</span>
          <span
            style={{
              fontFamily: 'var(--font-display), Georgia, serif',
              fontWeight: 700,
              fontSize: '1.1rem',
              letterSpacing: '-0.01em',
            }}
          >
            {appName}
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Locale switcher */}
          <button
            onClick={() => setLocale(locale === 'cs' ? 'en' : 'cs')}
            style={{
              background: 'rgba(255,255,255,0.15)',
              color: '#fff',
              border: 'none',
              borderRadius: '0.375rem',
              padding: '0.25rem 0.625rem',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {t.switchLocale}
          </button>

          {user && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '0.375rem',
                  padding: '0.375rem 0.75rem',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                }}
              >
                <span>👤</span>
                <span className="hidden sm:inline">{user.nickname}</span>
                <span style={{ fontSize: '0.625rem' }}>▼</span>
              </button>

              {menuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 'calc(100% + 8px)',
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--border-radius)',
                    minWidth: '170px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    overflow: 'hidden',
                  }}
                  onClick={() => setMenuOpen(false)}
                >
                  <Link
                    href="/"
                    style={{ display: 'block', padding: '0.75rem 1rem', color: 'var(--color-text)', fontSize: '0.9rem', textDecoration: 'none' }}
                    className="hover:bg-gray-50"
                  >
                    🛣️ {t.allRides}
                  </Link>
                  <Link
                    href="/my-rides"
                    style={{ display: 'block', padding: '0.75rem 1rem', color: 'var(--color-text)', fontSize: '0.9rem', textDecoration: 'none' }}
                    className="hover:bg-gray-50"
                  >
                    🚗 {t.myRides}
                  </Link>
                  <Link
                    href="/profile"
                    style={{ display: 'block', padding: '0.75rem 1rem', color: 'var(--color-text)', fontSize: '0.9rem', textDecoration: 'none' }}
                    className="hover:bg-gray-50"
                  >
                    👤 {t.myProfile}
                  </Link>
                  {process.env.NEXT_PUBLIC_ADMIN_ENABLED === 'true' && (
                    <Link
                      href="/admin"
                      style={{ display: 'block', padding: '0.75rem 1rem', color: 'var(--color-text)', fontSize: '0.9rem', textDecoration: 'none' }}
                      className="hover:bg-gray-50"
                    >
                      ⚙️ {t.admin}
                    </Link>
                  )}
                  <form action="/api/auth/signout" method="POST">
                    <button
                      type="submit"
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        padding: '0.75rem 1rem',
                        color: 'var(--color-error)',
                        background: 'none',
                        border: 'none',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        borderTop: '1px solid var(--color-border)',
                      }}
                      className="hover:bg-red-50"
                    >
                      🚪 {t.signOut}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
