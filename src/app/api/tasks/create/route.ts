import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { sendSMS, formatOnboarding } from '@/lib/sms';
import { calculateNextDue, formatDateForSMS } from '@/lib/scheduler';

function normaliseUKPhone(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  if (digits.startsWith('0') && digits.length === 11) return '+44' + digits.slice(1);
  if (digits.startsWith('44') && digits.length === 12) return '+' + digits;
  if (input.startsWith('+44') && digits.length === 12) return '+' + digits;
  if (digits.startsWith('7') && digits.length === 10) return '+44' + digits;
  return null;
}

export async function POST(req: NextRequest) {
  const { phone: bodyPhone, title, cadence_type, cadence_meta, reminder_time_local } = await req.json();
  const supabase = createServiceClient();

  // Get phone from body or cookie
  const cookiePhone = req.cookies.get('again_phone')?.value;
  const rawPhone = bodyPhone || cookiePhone || '';
  const normalised = normaliseUKPhone(rawPhone) || rawPhone;

  if (!normalised) {
    return NextResponse.json({ error: 'not logged in' }, { status: 401 });
  }

  const { data: user } = await supabase
    .from('users').select('id, plan, phone')
    .eq('phone', normalised).single();

  if (!user) {
    return NextResponse.json({ error: 'user not found' }, { status: 404 });
  }

  // Check task limit
  const { count } = await supabase
    .from('tasks').select('*', { count: 'exact', head: true })
    .eq('user_id', user.id).eq('status', 'active');

  const isOverLimit = user.plan === 'free' && (count || 0) >= 1;
  const taskStatus = isOverLimit ? 'inactive' : 'active';

  const nextDue = calculateNextDue(
    cadence_type,
    cadence_meta || null,
    reminder_time_local
  );

  const { data: task, error } = await supabase.from('tasks').insert({
    user_id: user.id,
    title: title.toUpperCase(),
    cadence_type,
    cadence_meta: cadence_meta || {},
    reminder_time_local,
    next_due_at_utc: nextDue.toISOString(),
    status: taskStatus,
  }).select().single();

  if (error) {
    console.error('Task creation error:', error);
    return NextResponse.json({ error: 'failed to create task' }, { status: 500 });
  }

  // FIRST TASK — demo on signup
  if (taskStatus === 'active' && (count || 0) === 0) {
    // Send onboarding welcome
    const onboardingText = formatOnboarding();
    await supabase.from('sms_events').insert({
      user_id: user.id, task_id: task.id,
      direction: 'out', kind: 'system', body: onboardingText,
    });
    await sendSMS(user.phone, onboardingText);

    // Wait 3 seconds then send demo reminder so they can try DONE immediately
    setTimeout(async () => {
      try {
        const demoText = `${title.toUpperCase()}\ndue now — this is a test.\nreply DONE or SNOOZE to try it out.`;

        await supabase.from('sms_events').insert({
          user_id: user.id, task_id: task.id,
          direction: 'out', kind: 'demo', body: demoText,
        });

        // Mark as reminded so DONE handler can find it
        await supabase.from('tasks').update({
          last_reminded_at_utc: new Date().toISOString(),
        }).eq('id', task.id);

        await sendSMS(user.phone, demoText);
      } catch (err) {
        console.error('Demo reminder failed:', err);
      }
    }, 3000);
  }

  return NextResponse.json({
    task,
    inactive: taskStatus === 'inactive',
  });
}
