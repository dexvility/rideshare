'use client';

import { useState, useRef, useEffect } from 'react';
import { useLocale } from '@/app/providers';

interface ContactButtonProps {
  name: string;
  phone: string;
  hasTelegram: boolean;
  hasWhatsapp: boolean;
  hasSignal: boolean;
  hasSms: boolean;
  preferredIM: string | null;
}

function buildLink(im: string, phone: string): string {
  const digits = phone.replace(/[^\d+]/g, '');
  switch (im) {
    case 'telegram':
      return `https://t.me/${digits}`;
    case 'whatsapp':
      return `https://wa.me/${digits.replace('+', '')}`;
    case 'signal':
      return `https://signal.me/#p/${digits}`;
    case 'sms':
      return `sms:${digits}`;
    default:
      return `tel:${digits}`;
  }
}

const IM_LABELS: Record<string, string> = {
  telegram: 'Telegram',
  whatsapp: 'WhatsApp',
  signal: 'Signal',
  sms: 'SMS',
};

const IM_ICONS: Record<string, string> = {
  telegram: '✈️',
  whatsapp: '💬',
  signal: '🔒',
  sms: '✉️',
};

export function ContactButton({ name, phone, hasTelegram, hasWhatsapp, hasSignal, hasSms, preferredIM }: ContactButtonProps) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const availableIMs = [
    hasTelegram && 'telegram',
    hasWhatsapp && 'whatsapp',
    hasSignal && 'signal',
    hasSms && 'sms',
  ].filter(Boolean) as string[];

  const primaryIM = preferredIM && availableIMs.includes(preferredIM) ? preferredIM : availableIMs[0];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handlePrimaryClick() {
    if (primaryIM) {
      window.open(buildLink(primaryIM, phone), '_blank');
    } else {
      setOpen(true);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(phone);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API may be unavailable; ignore silently
    }
    setOpen(false);
  }

  const otherIMs = availableIMs.filter(im => im !== primaryIM);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex' }}>
      <div style={{ display: 'flex', borderRadius: 'calc(var(--border-radius) * 0.75)', overflow: 'hidden', border: '1px solid var(--color-primary)' }}>
        <button
          onClick={handlePrimaryClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.5rem 0.875rem',
            background: 'var(--color-primary)',
            color: '#fff',
            border: 'none',
            fontSize: '0.85rem',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          {primaryIM ? IM_ICONS[primaryIM] : '📞'} {t.contact}
        </button>
        <button
          onClick={() => setOpen(!open)}
          aria-label="More contact options"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.5rem 0.5rem',
            background: 'var(--color-primary)',
            color: '#fff',
            border: 'none',
            borderLeft: '1px solid rgba(255,255,255,0.25)',
            cursor: 'pointer',
            fontSize: '0.7rem',
          }}
        >
          ▼
        </button>
      </div>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--border-radius)',
            minWidth: '200px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
            overflow: 'hidden',
            zIndex: 50,
          }}
        >
          {otherIMs.length > 0 && (
            <div style={{ padding: '0.4rem 0', borderBottom: '1px solid var(--color-border)' }}>
              <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', padding: '0.25rem 0.875rem' }}>{t.openIn}</p>
              {otherIMs.map(im => (
                <a
                  key={im}
                  href={buildLink(im, phone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 0.875rem',
                    fontSize: '0.85rem',
                    color: 'var(--color-text)',
                    textDecoration: 'none',
                  }}
                  className="hover:bg-gray-50"
                >
                  {IM_ICONS[im]} {IM_LABELS[im]}
                </a>
              ))}
            </div>
          )}
          <button
            onClick={handleCopy}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              width: '100%',
              padding: '0.5rem 0.875rem',
              fontSize: '0.85rem',
              color: 'var(--color-text)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
            }}
            className="hover:bg-gray-50"
          >
            📋 {copied ? t.phoneCopied : t.copyPhone}
          </button>
        </div>
      )}
    </div>
  );
}
