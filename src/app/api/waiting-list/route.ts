import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

// Deliberately loose: enough to catch typos and junk, not a full RFC 5322
// implementation. The only real validation is whether the notification lands.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: NextRequest) {
  let email: string;

  try {
    const body = await req.json();
    email = String(body?.email ?? '').trim().toLowerCase();
  } catch {
    return NextResponse.json({ error: 'invalid request' }, { status: 400 });
  }

  if (!email || email.length > 254 || !EMAIL.test(email)) {
    return NextResponse.json({ error: 'enter a valid email address.' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Duplicate-safe: `email` is unique, so a resubmission is a no-op rather than
  // an error. The caller is told it succeeded either way — whether an address is
  // already on the list isn't something a stranger should be able to probe.
  const { error } = await supabase
    .from('waiting_list')
    .upsert({ email }, { onConflict: 'email', ignoreDuplicates: true });

  if (error) {
    console.error('waiting list insert failed:', error);
    return NextResponse.json({ error: 'could not save that. try again.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
