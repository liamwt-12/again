import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

function normaliseUKPhone(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  if (digits.startsWith('0') && digits.length === 11) return '+44' + digits.slice(1);
  if (digits.startsWith('44') && digits.length === 12) return '+' + digits;
  if (input.startsWith('+44') && digits.length === 12) return '+' + digits;
  if (digits.startsWith('7') && digits.length === 10) return '+44' + digits;
  return null;
}

export async function POST(req: NextRequest) {
  const { phone, otp } = await req.json();
  const supabase = createServiceClient();

  const normalised = normaliseUKPhone(phone || '') || phone;

  const { data: authData, error } = await supabase.auth.verifyOtp({
    phone: normalised,
    token: otp,
    type: 'sms',
  });

  if (error) {
    console.error('OTP verify error:', error);
    return NextResponse.json({ error: 'invalid code. try again.' }, { status: 400 });
  }

  // Ensure user exists in our users table
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('phone', normalised)
    .single();

  if (!existingUser) {
    const { error: insertError } = await supabase.from('users').insert({
      id: authData.user?.id,
      phone: normalised,
      timezone: 'Europe/London',
      plan: 'free',
    });

    if (insertError) {
      console.error('User creation error:', insertError);
      if (!insertError.message.includes('duplicate')) {
        return NextResponse.json({ error: 'failed to create account. try again.' }, { status: 500 });
      }
    }
  }

  // Set cookie with phone number for dashboard auth
  const response = NextResponse.json({
    success: true,
    userId: authData.user?.id,
    phone: normalised,
    session: authData.session,
  });

  response.cookies.set('again_phone', normalised, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: '/',
  });

  return response;
}
