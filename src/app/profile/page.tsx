// src/app/profile/page.tsx
export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session';
import { ProfileClient } from './ProfileClient';

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth');
  return <ProfileClient user={JSON.parse(JSON.stringify(user))} />;
}
