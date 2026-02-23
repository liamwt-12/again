import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { sendSMS, formatOnboarding } from '@/lib/sms';
import { calculateNextDue } from '@/lib/scheduler';

export async function POST(req: NextRequest) {
  const { phone, title, cadence_type, cadence_meta, reminder_time_local } = await req.json();
  const supabase = createServiceClient();

  // Find or validate user
  const { data: user } = await supabase
    .from('users')
    .select('id, plan, phone')
    .eq('phone', phone)
    .single();

  if (!user) {
    return NextResponse.json({ error: 'user not found' }, { status: 404 });
  }

  // Check task limit for free users
  const { count } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'active');

  const isOverLimit = user.plan === 'free' && (count || 0) >= 1;
  const taskStatus = isOverLimit ? 'inactive' : 'active';

  // Calculate next due date
  const nextDue = calculateNextDue(
    cadence_type,
    cadence_meta || null,
    reminder_time_local
  );

  // Create task
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

  // If this is the user's first task (active), send onboarding SMS
  if (taskStatus === 'active' && (count || 0) === 0) {
    const onboardingText = formatOnboarding();

    // Log outbound
    await supabase.from('sms_events').insert({
      user_id: user.id,
      task_id: task.id,
      direction: 'out',
      kind: 'system',
      body: onboardingText,
    });

    await sendSMS(user.phone, onboardingText);
  }

  return NextResponse.json({
    task,
    inactive: taskStatus === 'inactive',
  });
}
