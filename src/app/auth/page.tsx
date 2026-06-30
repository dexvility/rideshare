import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session';
import { AUTH_MODE, GOOGLE_ENABLED } from '@/lib/auth-config';
import { AuthClient } from './AuthClient';

export default async function AuthPage({ searchParams }: { searchParams: { error?: string } }) {
  const user = await getCurrentUser();
  if (user) redirect(user.profileComplete ? '/' : '/auth/complete-profile');

  return (
    <AuthClient
      authMode={AUTH_MODE}
      googleEnabled={GOOGLE_ENABLED}
      oauthError={searchParams.error}
    />
  );
}
