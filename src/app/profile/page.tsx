// src/app/profile/page.tsx
export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session';
import { AUTH_MODE } from '@/lib/auth-config';
import { ProfileClient } from './ProfileClient';

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth');
  if (!user.profileComplete) redirect('/auth/complete-profile');
  const ntfyUrl = (process.env.NTFY_URL || 'https://ntfy.sh').replace(/\/$/, '');
  return <ProfileClient user={JSON.parse(JSON.stringify(user))} authMode={AUTH_MODE} ntfyUrl={ntfyUrl} />;
}
