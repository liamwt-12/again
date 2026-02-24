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

  // Normalise the phone for verification
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
      // If it's a duplicate key error, the user already exists with a different phone format
      // Try to continue anyway
      if (!insertError.message.includes('duplicate')) {
        return NextResponse.json({ error: 'failed to create account. try again.' }, { status: 500 });
      }
    }
  }

  return NextResponse.json({
    success: true,
    userId: authData.user?.id,
    phone: normalised,
    session: authData.session,
  });
}
