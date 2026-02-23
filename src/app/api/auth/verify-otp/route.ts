import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const { phone, otp } = await req.json();
  const supabase = createServiceClient();

  const { data: authData, error } = await supabase.auth.verifyOtp({
    phone,
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
    .eq('phone', phone)
    .single();

  if (!existingUser) {
    const { error: insertError } = await supabase.from('users').insert({
      id: authData.user?.id,
      phone,
      timezone: 'Europe/London',
      plan: 'free',
    });

    if (insertError) {
      console.error('User creation error:', insertError);
    }
  }

  return NextResponse.json({
    success: true,
    userId: authData.user?.id,
    session: authData.session,
  });
}
