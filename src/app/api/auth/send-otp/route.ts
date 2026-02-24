import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

function normaliseUKPhone(input: string): string | null {
  // Strip all non-digit characters
  const digits = input.replace(/\D/g, '');

  // 07xxx format (11 digits)
  if (digits.startsWith('0') && digits.length === 11) {
    return '+44' + digits.slice(1);
  }

  // 447xxx format (12 digits)
  if (digits.startsWith('44') && digits.length === 12) {
    return '+' + digits;
  }

  // Already has +44 prefix
  if (input.startsWith('+44') && digits.length === 12) {
    return '+' + digits;
  }

  // 7xxx format without leading 0 (10 digits)
  if (digits.startsWith('7') && digits.length === 10) {
    return '+44' + digits;
  }

  return null;
}

export async function POST(req: NextRequest) {
  const { phone } = await req.json();

  const normalised = normaliseUKPhone(phone || '');

  if (!normalised) {
    return NextResponse.json({ error: 'enter a valid uk mobile number.' }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { error } = await supabase.auth.signInWithOtp({
    phone: normalised,
  });

  if (error) {
    console.error('OTP send error:', error);
    return NextResponse.json({ error: 'failed to send code. try again.' }, { status: 500 });
  }

  return NextResponse.json({ success: true, phone: normalised });
}
