import { prisma } from './prisma';

export interface ThemeConfig {
  colorPrimary: string;
  colorSecondary: string;
  colorAccent: string;
  colorBackground: string;
  colorSurface: string;
  colorText: string;
  colorTextMuted: string;
  colorBorder: string;
  colorSuccess: string;
  colorError: string;
  fontDisplay: string;
  fontBody: string;
  borderRadius: string;
  // Branding — editable from /admin, seeded from env vars on first bootstrap.
  appName: string;       // shown in the nav bar next to the emoji
  heroEmoji: string;     // emoji shown in nav bar + auth screen
  h1Title: string;       // homepage main heading
  h2Subtitle: string;    // homepage subheading (date / location line)
}

export const DEFAULT_THEME: ThemeConfig = {
  colorPrimary: '#2D5016',
  colorSecondary: '#8B6914',
  colorAccent: '#C8A951',
  colorBackground: '#FAFAF7',
  colorSurface: '#FFFFFF',
  colorText: '#1A1A1A',
  colorTextMuted: '#6B7280',
  colorBorder: '#E5E7EB',
  colorSuccess: '#16A34A',
  colorError: '#DC2626',
  fontDisplay: 'Playfair Display',
  fontBody: 'Inter',
  borderRadius: '0.75rem',
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'Ride Share',
  heroEmoji: process.env.NEXT_PUBLIC_HERO_EMOJI || '🚗',
  h1Title: process.env.NEXT_PUBLIC_H1_TITLE || 'Ride Sharing',
  h2Subtitle: process.env.NEXT_PUBLIC_H2_SUBTITLE || 'Find or offer a ride',
};

export async function getTheme(): Promise<{ config: ThemeConfig; customCss: string }> {
  try {
    const row = await prisma.themeConfig.findFirst();
    if (!row) return { config: DEFAULT_THEME, customCss: '' };
    // Merge with defaults so older rows (saved before branding fields existed)
    // don't end up with undefined values.
    const merged = { ...DEFAULT_THEME, ...(row.config as unknown as Partial<ThemeConfig>) };
    return {
      config: merged,
      customCss: row.customCss,
    };
  } catch {
    return { config: DEFAULT_THEME, customCss: '' };
  }
}

export function themeToCssVars(config: ThemeConfig): string {
  return `
    --color-primary: ${config.colorPrimary};
    --color-secondary: ${config.colorSecondary};
    --color-accent: ${config.colorAccent};
    --color-background: ${config.colorBackground};
    --color-surface: ${config.colorSurface};
    --color-text: ${config.colorText};
    --color-text-muted: ${config.colorTextMuted};
    --color-border: ${config.colorBorder};
    --color-success: ${config.colorSuccess};
    --color-error: ${config.colorError};
    --font-display: '${config.fontDisplay}';
    --font-body: '${config.fontBody}';
    --border-radius: ${config.borderRadius};
  `.trim();
}
