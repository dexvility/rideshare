import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session';
import { CompleteProfileClient } from './CompleteProfileClient';

export default async function CompleteProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth');
  if (user.profileComplete) redirect('/');
  return <CompleteProfileClient />;
}
