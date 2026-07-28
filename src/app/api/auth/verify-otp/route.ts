import { NextResponse } from 'next/server';

// Switched off 2026-07-28 when again closed to new signups (see
// docs/portfolio-audit.md). This route used to create the user row on first
// verification, so leaving it live meant accounts could still be created by
// POSTing directly. Kept as an explicit 410 rather than deleted.
export async function POST() {
  return NextResponse.json(
    { error: 'again is closed to new signups.' },
    { status: 410 }
  );
}
