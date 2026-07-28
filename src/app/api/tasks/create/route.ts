import { NextResponse } from 'next/server';

// Switched off 2026-07-28 when again closed to new signups (see
// docs/portfolio-audit.md). This route created the first task and sent the
// welcome plus demo reminder SMS, so it was the last outbound SMS path
// reachable from the web. Kept as an explicit 410 rather than deleted.
export async function POST() {
  return NextResponse.json(
    { error: 'again is closed to new signups.' },
    { status: 410 }
  );
}
