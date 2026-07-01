// src/app/layout.tsx
import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import './globals.css';
import { NavBar } from '@/components/ui/NavBar';
import { PwaBanner } from '@/components/ui/PwaBanner';
import { NtfyBanner } from '@/components/ui/NtfyBanner';
import { Providers } from './providers';
import { DEFAULT_THEME } from '@/lib/theme';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Ride Share',
  description: 'Self-hosted ride-sharing coordination for your event',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Rides',
  },
  icons: {
    apple: '/icon-192.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#2D5016',
};

// Default theme CSS vars — overridden at runtime by ThemeScript below
const DEFAULT_CSS = `
  --color-primary: #2D5016;
  --color-secondary: #8B6914;
  --color-accent: #C8A951;
  --color-background: #FAFAF7;
  --color-surface: #FFFFFF;
  --color-text: #1A1A1A;
  --color-text-muted: #6B7280;
  --color-border: #E5E7EB;
  --color-success: #16A34A;
  --color-error: #DC2626;
  --font-display: 'Playfair Display';
  --font-body: 'Inter';
  --border-radius: 0.75rem;
`;

// Server component that loads theme — isolated so it can fail gracefully
async function ThemeScript() {
  try {
    const { getTheme, themeToCssVars } = await import('@/lib/theme');
    const { config, customCss } = await getTheme();
    const cssVars = themeToCssVars(config);
    return (
      <>
        <style>{`:root { ${cssVars} }`}</style>
        {customCss && <style>{customCss}</style>}
      </>
    );
  } catch {
    return <style>{`:root { ${DEFAULT_CSS} }`}</style>;
  }
}

async function getCurrentUserSafe() {
  try {
    const { getCurrentUser } = await import('@/lib/session');
    return await getCurrentUser();
  } catch {
    return null;
  }
}

async function getBrandingSafe() {
  try {
    const { getTheme } = await import('@/lib/theme');
    const { config } = await getTheme();
    return { appName: config.appName, heroEmoji: config.heroEmoji };
  } catch {
    return { appName: DEFAULT_THEME.appName, heroEmoji: DEFAULT_THEME.heroEmoji };
  }
}

// Detects the visitor's preferred locale from the Accept-Language header.
// Used only as the *initial* locale on first visit — once the user picks a
// language via the nav toggle, that choice is stored in localStorage and
// takes over from then on (see providers.tsx).
function detectLocaleFromHeader(): 'cs' | 'en' {
  try {
    const acceptLanguage = headers().get('accept-language') || '';
    // Accept-Language looks like "cs-CZ,cs;q=0.9,en-US;q=0.8,en;q=0.7"
    const primary = acceptLanguage.split(',')[0]?.trim().toLowerCase().slice(0, 2);
    return primary === 'cs' ? 'cs' : 'en';
  } catch {
    return 'en';
  }
}

export default async function RootLayout({ children, modal }: { children: React.ReactNode; modal: React.ReactNode }) {
  const user = await getCurrentUserSafe();
  const { appName, heroEmoji } = await getBrandingSafe();
  const detectedLocale = detectLocaleFromHeader();

  return (
    <html lang={detectedLocale}>
      <head>
        <ThemeScript />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers detectedLocale={detectedLocale}>
          <PwaBanner />
          {user && <NtfyBanner />}
          <NavBar user={user} appName={appName} heroEmoji={heroEmoji} />
          <main className="min-h-screen pb-20">
            {children}
          </main>
          {modal}
        </Providers>
      </body>
    </html>
  );
}
