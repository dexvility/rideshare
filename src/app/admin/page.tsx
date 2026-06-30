// src/app/admin/page.tsx
export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { AdminClient } from './AdminClient';
import { getTheme, DEFAULT_THEME } from '@/lib/theme';

export default async function AdminPage() {
  const adminToken = cookies().get('admin_token')?.value;
  if (!adminToken || adminToken !== process.env.ADMIN_SECRET) {
    redirect('/admin/login');
  }

  const { config, customCss } = await getTheme();
  return <AdminClient initialConfig={config} initialCss={customCss} />;
}
