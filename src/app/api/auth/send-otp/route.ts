import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const { phone } = await req.json();

  if (!phone || !phone.startsWith('+44')) {
    return NextResponse.json({ error: 'uk numbers only during beta.' }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { error } = await supabase.auth.signInWithOtp({
    phone,
  });

  if (error) {
    console.error('OTP send error:', error);
    return NextResponse.json({ error: 'failed to send code. try again.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
