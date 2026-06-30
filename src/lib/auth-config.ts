export type AuthMode = 'phone' | 'password';

export const AUTH_MODE: AuthMode =
  (process.env.AUTH_MODE as AuthMode) === 'password' ? 'password' : 'phone';

export const GOOGLE_ENABLED =
  AUTH_MODE === 'password' &&
  !!process.env.GOOGLE_CLIENT_ID &&
  !!process.env.GOOGLE_CLIENT_SECRET;

export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? '';
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? '';
export const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL ?? '';
