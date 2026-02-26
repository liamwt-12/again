import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServiceClient } from '@/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const PRICES = {
  annual: process.env.STRIPE_PRICE_ANNUAL || 'price_1T3xCJEOQ4ZTBEbMsEFZMVb6',
  monthly: process.env.STRIPE_PRICE_MONTHLY || 'price_1T3xC0EOQ4ZTBEbM1awZHS8L',
};

function normaliseUKPhone(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  if (digits.startsWith('0') && digits.length === 11) return '+44' + digits.slice(1);
  if (digits.startsWith('44') && digits.length === 12) return '+' + digits;
  if (input.startsWith('+44') && digits.length === 12) return '+' + digits;
  if (digits.startsWith('7') && digits.length === 10) return '+44' + digits;
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { priceType } = await req.json();

    // Get phone from cookie
    const cookiePhone = req.cookies.get('again_phone')?.value;
    if (!cookiePhone) {
      return NextResponse.json({ error: 'not logged in' }, { status: 401 });
    }

    const normalised = normaliseUKPhone(cookiePhone) || cookiePhone;

    // Look up user
    const supabase = createServiceClient();
    const { data: user } = await supabase
      .from('users')
      .select('id, phone, stripe_customer_id')
      .eq('phone', normalised)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'user not found' }, { status: 404 });
    }

    const priceId = priceType === 'annual' ? PRICES.annual : PRICES.monthly;

    // Create or reuse Stripe customer
    let customerId = user.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        phone: user.phone,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await supabase.from('users').update({ stripe_customer_id: customerId }).eq('id', user.id);
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      metadata: {
        userId: user.id,
        userPhone: user.phone,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
