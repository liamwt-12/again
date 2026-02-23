import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServiceClient } from '@/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'invalid signature' }, { status: 400 });
  }

  const supabase = createServiceClient();

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single();

      if (user && subscription.status === 'active') {
        await supabase.from('users').update({ plan: 'pro' }).eq('id', user.id);
        await supabase.from('tasks').update({ status: 'active' }).eq('user_id', user.id).eq('status', 'inactive');
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single();

      if (user) {
        await supabase.from('users').update({ plan: 'free' }).eq('id', user.id);

        const { data: tasks } = await supabase
          .from('tasks')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('created_at', { ascending: true });

        if (tasks && tasks.length > 1) {
          const taskIdsToPause = tasks.slice(1).map(t => t.id);
          await supabase.from('tasks').update({ status: 'paused' }).in('id', taskIdsToPause);
        }
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
