import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DEFAULT_THEME } from '@/lib/theme';

function checkAdminAuth(req: NextRequest): boolean {
  const token = req.headers.get('x-admin-token') || req.cookies.get('admin_token')?.value;
  return token === process.env.ADMIN_SECRET;
}

export async function GET(req: NextRequest) {
  if (!checkAdminAuth(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const theme = await prisma.themeConfig.findFirst();
  return NextResponse.json(theme || { config: DEFAULT_THEME, customCss: '' });
}

export async function PUT(req: NextRequest) {
  if (!checkAdminAuth(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json();
  const { config, customCss } = body;

  const updated = await prisma.themeConfig.upsert({
    where: { id: 1 },
    update: { config, customCss: customCss || '' },
    create: { config, customCss: customCss || '' },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  if (!checkAdminAuth(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  await prisma.themeConfig.upsert({
    where: { id: 1 },
    update: { config: DEFAULT_THEME as any, customCss: '' },
    create: { config: DEFAULT_THEME as any, customCss: '' },
  });

  return NextResponse.json({ ok: true });
}
