import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { sendSMS, formatDoneConfirmation, formatSnoozeConfirmation, formatSkipConfirmation, formatNoPending, formatInvalidCommand } from '@/lib/sms';
import { calculateNextDue, calculateSmartSnooze, calculateExplicitSnooze, formatDateForSMS, formatSnoozeTimeForSMS, calculateOverdueDays } from '@/lib/scheduler';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const body = (formData.get('Body') as string || '').trim();
  const from = (formData.get('From') as string || '').trim();

  const supabase = createServiceClient();

  // Look up user by phone
  const { data: user } = await supabase
    .from('users')
    .select('id, phone')
    .eq('phone', from)
    .single();

  // Unrecognised number — do not respond
  if (!user) {
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      { headers: { 'Content-Type': 'text/xml' } }
    );
  }

  // Log inbound message
  await supabase.from('sms_events').insert({
    user_id: user.id,
    direction: 'in',
    kind: 'inbound',
    body: body,
  });

  // Parse command (case-insensitive)
  const command = body.toUpperCase().trim();
  let responseText = '';

  if (command === 'DONE') {
    responseText = await handleDone(supabase, user);
  } else if (command === 'SKIP') {
    responseText = await handleSkip(supabase, user);
  } else if (command.startsWith('SNOOZE')) {
    const duration = command.replace('SNOOZE', '').trim();
    responseText = await handleSnooze(supabase, user, duration);
  } else {
    responseText = formatInvalidCommand();
  }

  // Send response SMS
  if (responseText) {
    await supabase.from('sms_events').insert({
      user_id: user.id,
      direction: 'out',
      kind: 'confirm',
      body: responseText,
    });
    await sendSMS(from, responseText);
  }

  return new NextResponse(
    '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
    { headers: { 'Content-Type': 'text/xml' } }
  );
}

async function handleDone(supabase: any, user: any): Promise<string> {
  // Find the most recent active task that's been reminded
  const { data: task } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .not('last_reminded_at_utc', 'is', null)
    .order('last_reminded_at_utc', { ascending: false })
    .limit(1)
    .single();

  if (!task) {
    return formatNoPending();
  }

  // Calculate next due date
  const nextDue = calculateNextDue(
    task.cadence_type,
    task.cadence_meta,
    task.reminder_time_local
  );
  const { date, time } = formatDateForSMS(nextDue);

  // Log completion
  await supabase.from('task_completions').insert({
    task_id: task.id,
    was_skipped: false,
  });

  // Update task
  await supabase.from('tasks').update({
    next_due_at_utc: nextDue.toISOString(),
    snooze_until_utc: null,
    occurrence_snooze_count: 0,
    stuck: false,
    last_reminded_at_utc: null, // Reset so it can be reminded again
  }).eq('id', task.id);

  return formatDoneConfirmation(task.title, date, time);
}

async function handleSkip(supabase: any, user: any): Promise<string> {
  const { data: task } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .not('last_reminded_at_utc', 'is', null)
    .order('last_reminded_at_utc', { ascending: false })
    .limit(1)
    .single();

  if (!task) {
    return formatNoPending();
  }

  // Calculate next due date (same logic as DONE)
  const nextDue = calculateNextDue(
    task.cadence_type,
    task.cadence_meta,
    task.reminder_time_local
  );
  const { date, time } = formatDateForSMS(nextDue);

  // Log as skipped completion
  await supabase.from('task_completions').insert({
    task_id: task.id,
    was_skipped: true,
  });

  // Update task
  await supabase.from('tasks').update({
    next_due_at_utc: nextDue.toISOString(),
    snooze_until_utc: null,
    occurrence_snooze_count: 0,
    stuck: false,
    last_reminded_at_utc: null,
  }).eq('id', task.id);

  return formatSkipConfirmation(task.title, date, time);
}

async function handleSnooze(supabase: any, user: any, duration: string): Promise<string> {
  const { data: task } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .not('last_reminded_at_utc', 'is', null)
    .order('last_reminded_at_utc', { ascending: false })
    .limit(1)
    .single();

  if (!task) {
    return formatNoPending();
  }

  // Calculate snooze time
  let snoozeUntil: Date;
  if (['1H', '3H', '1D'].includes(duration)) {
    snoozeUntil = calculateExplicitSnooze(duration as '1H' | '3H' | '1D', task.reminder_time_local);
  } else {
    snoozeUntil = calculateSmartSnooze();
  }

  const newOccurrenceCount = (task.occurrence_snooze_count || 0) + 1;
  const snoozeDisplay = formatSnoozeTimeForSMS(snoozeUntil);

  // Update task
  await supabase.from('tasks').update({
    snooze_until_utc: snoozeUntil.toISOString(),
    snooze_count: (task.snooze_count || 0) + 1,
    occurrence_snooze_count: newOccurrenceCount,
    last_reminded_at_utc: null, // Allow re-reminder after snooze
  }).eq('id', task.id);

  return formatSnoozeConfirmation(task.title, newOccurrenceCount, snoozeDisplay);
}
