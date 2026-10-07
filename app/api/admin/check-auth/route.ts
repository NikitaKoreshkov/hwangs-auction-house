import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  return NextResponse.json({ success: true });
}
