import { NextResponse } from 'next/server';
import { AUTH_MODE, GOOGLE_ENABLED } from '@/lib/auth-config';

export async function GET() {
  return NextResponse.json({ authMode: AUTH_MODE, googleEnabled: GOOGLE_ENABLED });
}
