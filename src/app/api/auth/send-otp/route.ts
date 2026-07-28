import { NextResponse } from 'next/server';

// Switched off 2026-07-28 when again closed to new signups (see
// docs/portfolio-audit.md). Kept as an explicit 410 rather than deleted so
// anything still pointing here gets a clear answer instead of a 404 — and so
// no account or OTP SMS can be created through it.
export async function POST() {
  return NextResponse.json(
    { error: 'again is closed to new signups.' },
    { status: 410 }
  );
}
