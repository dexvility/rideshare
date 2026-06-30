'use client';

import { useState } from 'react';
import { DEFAULT_THEME, type ThemeConfig } from '@/lib/theme';
import { useLocale } from '@/app/providers';

interface AdminClientProps {
  initialConfig: ThemeConfig;
  initialCss: string;
}

const COLOR_FIELDS: { key: keyof ThemeConfig; label: string }[] = [
  { key: 'colorPrimary', label: 'Primární barva' },
  { key: 'colorSecondary', label: 'Sekundární barva' },
  { key: 'colorAccent', label: 'Akcentová barva' },
  { key: 'colorBackground', label: 'Pozadí stránky' },
  { key: 'colorSurface', label: 'Pozadí karet' },
  { key: 'colorText', label: 'Hlavní text' },
  { key: 'colorTextMuted', label: 'Vedlejší text' },
  { key: 'colorBorder', label: 'Ohraničení' },
  { key: 'colorSuccess', label: 'Úspěch (zelená)' },
  { key: 'colorError', label: 'Chyba (červená)' },
];

export function AdminClient({ initialConfig, initialCss }: AdminClientProps) {
  const { t } = useLocale();
  const [config, setConfig] = useState<ThemeConfig>(initialConfig);
  const [customCss, setCustomCss] = useState(initialCss);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  function updateColor(key: keyof ThemeConfig, value: string) {
    const next = { ...config, [key]: value };
    setConfig(next);
    // Live preview
    document.documentElement.style.setProperty(`--color-${key.replace('color', '').replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '')}`, value);
  }

  async function handleSave() {
    setSaving(true);
    const res = await fetch('/api/admin/theme', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config, customCss }),
    });
    setSaving(false);
    if (res.ok) showToast('✓ Motiv uložen. Stránka se obnoví.');
    else showToast('❌ Chyba při ukládání');
  }

  async function handleReset() {
    if (!confirm('Obnovit výchozí motiv?')) return;
    const res = await fetch('/api/admin/theme', { method: 'DELETE' });
    if (res.ok) {
      setConfig(DEFAULT_THEME);
      setCustomCss('');
      // Reset CSS vars
      for (const field of COLOR_FIELDS) {
        const cssKey = `--color-${field.key.replace('color', '').replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '')}`;
        document.documentElement.style.removeProperty(cssKey);
      }
      showToast('Motiv obnoven.');
    }
  }

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display), Georgia, serif', fontSize: '1.8rem', fontWeight: 700, color: 'var(--color-primary)' }}>
            ⚙️ {t.adminTitle}
          </h1>
          <div className="accent-line" />
        </div>
        <div style={{ display: 'flex', gap: '0.625rem' }}>
          <button onClick={handleReset} className="btn-secondary" style={{ fontSize: '0.875rem' }}>↩ {t.resetTheme}</button>
          <button onClick={handleSave} className="btn-primary" disabled={saving} style={{ fontSize: '0.875rem' }}>
            {saving ? '…' : `💾 ${t.applyTheme}`}
          </button>
        </div>
      </div>

      {/* Color grid */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>🎨 {t.themeEditor}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          {COLOR_FIELDS.map(({ key, label }) => (
            <div key={key}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem', cursor: 'pointer' }}>
                <input
                  type="color"
                  value={config[key] as string}
                  onChange={e => updateColor(key, e.target.value)}
                  style={{ width: '2rem', height: '2rem', border: '1px solid var(--color-border)', borderRadius: '0.375rem', cursor: 'pointer', padding: '2px' }}
                />
                {label}
              </label>
              <input
                className="input-base"
                value={config[key] as string}
                onChange={e => updateColor(key, e.target.value)}
                style={{ fontSize: '0.8rem', padding: '0.375rem 0.625rem', fontFamily: 'monospace' }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Branding */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>🏷️ {t.brandingSection}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem' }}>{t.appNameLabel}</label>
            <input
              className="input-base"
              value={config.appName}
              onChange={e => setConfig(c => ({ ...c, appName: e.target.value }))}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem' }}>{t.heroEmojiLabel}</label>
            <input
              className="input-base"
              value={config.heroEmoji}
              onChange={e => setConfig(c => ({ ...c, heroEmoji: e.target.value }))}
              style={{ fontSize: '1.2rem' }}
              maxLength={4}
            />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem' }}>{t.h1TitleLabel}</label>
            <input
              className="input-base"
              value={config.h1Title}
              onChange={e => setConfig(c => ({ ...c, h1Title: e.target.value }))}
            />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem' }}>{t.h2SubtitleLabel}</label>
            <input
              className="input-base"
              value={config.h2Subtitle}
              onChange={e => setConfig(c => ({ ...c, h2Subtitle: e.target.value }))}
            />
          </div>
        </div>
      </div>

      {/* Typography */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>🔤 Typografie</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem' }}>Nadpisové písmo</label>
            <input
              className="input-base"
              value={config.fontDisplay}
              onChange={e => setConfig(c => ({ ...c, fontDisplay: e.target.value }))}
              placeholder="Playfair Display"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem' }}>Tělo textu</label>
            <input
              className="input-base"
              value={config.fontBody}
              onChange={e => setConfig(c => ({ ...c, fontBody: e.target.value }))}
              placeholder="Inter"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem' }}>Zaoblení rohů</label>
            <input
              className="input-base"
              value={config.borderRadius}
              onChange={e => setConfig(c => ({ ...c, borderRadius: e.target.value }))}
              placeholder="0.75rem"
            />
          </div>
        </div>
      </div>

      {/* Custom CSS */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.375rem' }}>💅 {t.customCss}</h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
          Libovolné CSS, které se přidá na konec stylů. Použijte pro jemnné ladění designu.
        </p>
        <textarea
          value={customCss}
          onChange={e => setCustomCss(e.target.value)}
          style={{
            width: '100%',
            height: '200px',
            fontFamily: 'monospace',
            fontSize: '0.85rem',
            padding: '0.75rem',
            border: '1px solid var(--color-border)',
            borderRadius: 'calc(var(--border-radius) * 0.75)',
            background: '#1e1e1e',
            color: '#d4d4d4',
            resize: 'vertical',
          }}
          placeholder="/* your custom CSS here */"
          spellCheck={false}
        />
      </div>

      {/* Live preview */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>👁️ Náhled</h2>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <button className="btn-primary">Primární tlačítko</button>
          <button className="btn-secondary">Sekundární tlačítko</button>
          <button className="btn-danger">Smazat</button>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <span className="badge badge-green">Volná místa</span>
          <span className="badge badge-yellow">Zdarma</span>
          <span className="badge badge-red">Plno</span>
          <span className="badge badge-gray">Zrušeno</span>
        </div>
        <div className="card" style={{ padding: '1rem' }}>
          <p style={{ fontFamily: 'var(--font-display), Georgia, serif', fontSize: '1.2rem', fontWeight: 700 }}>
            Nadpis v Display písmu
          </p>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Běžný text v body písmu s vedlejší barvou.
          </p>
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
