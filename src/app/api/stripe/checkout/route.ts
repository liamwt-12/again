import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

const PRICES = {
  annual: process.env.STRIPE_PRICE_ANNUAL || 'price_1T3xCJEOQ4ZTBEbMsEFZMVb6',
  monthly: process.env.STRIPE_PRICE_MONTHLY || 'price_1T3xC0EOQ4ZTBEbM1awZHS8L',
};

export async function POST(req: NextRequest) {
  try {
    const { priceType, userId, userPhone } = await req.json();
    const priceId = priceType === 'annual' ? PRICES.annual : PRICES.monthly;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      metadata: {
        userId: userId || '',
        userPhone: userPhone || '',
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
