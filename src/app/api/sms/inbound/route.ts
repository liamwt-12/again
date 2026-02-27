import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import {
  sendSMS,
  formatDoneConfirmation,
  formatFirstDone,
  formatStreak,
  formatSnoozeConfirmation,
  formatComeback,
  formatSkipConfirmation,
  formatNoPending,
  formatInvalidCommand,
  formatPauseConfirmation,
  formatResumeConfirmation,
  formatOnceDone,
} from '@/lib/sms';
import {
  calculateNextDue,
  calculateSmartSnooze,
  calculateExplicitSnooze,
  formatDateForSMS,
  formatSnoozeTimeForSMS,
} from '@/lib/scheduler';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const body = (formData.get('Body') as string || '').trim();
  const from = (formData.get('From') as string || '').trim();

  const supabase = createServiceClient();

  // Look up user by phone — try both formats
  let user: any = null;
  const { data: u1 } = await supabase
    .from('users')
    .select('id, phone')
    .eq('phone', from)
    .single();

  if (u1) {
    user = u1;
  } else {
    const altPhone = from.startsWith('+') ? from.slice(1) : `+${from}`;
    const { data: u2 } = await supabase
      .from('users')
      .select('id, phone')
      .eq('phone', altPhone)
      .single();
    if (u2) user = u2;
  }

  if (!user) {
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      { headers: { 'Content-Type': 'text/xml' } }
    );
  }

  await supabase.from('sms_events').insert({
    user_id: user.id,
    direction: 'in',
    kind: 'inbound',
    body: body,
  });

  const command = body.toUpperCase().trim();
  let responseText = '';

  if (command === 'DONE') {
    responseText = await handleDone(supabase, user);
  } else if (command === 'SKIP') {
    responseText = await handleSkip(supabase, user);
  } else if (command.startsWith('SNOOZE')) {
    const duration = command.replace('SNOOZE', '').trim();
    responseText = await handleSnooze(supabase, user, duration);
  } else if (command === 'STOP' || command === 'PAUSE') {
    responseText = await handleStop(supabase, user);
  } else if (command === 'START' || command === 'YES' || command === 'RESUME') {
    responseText = await handleResume(supabase, user);
  } else {
    responseText = formatInvalidCommand();
  }

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

// ============================================================
// DONE — with one-off completion, first-done, streaks
// ============================================================
async function handleDone(supabase: any, user: any): Promise<string> {
  const { data: task } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .not('last_reminded_at_utc', 'is', null)
    .order('last_reminded_at_utc', { ascending: false })
    .limit(1)
    .single();

  if (!task) return formatNoPending();

  // Log completion
  await supabase.from('task_completions').insert({
    task_id: task.id,
    was_skipped: false,
  });

  // ONE-OFF TASKS: mark as completed, no rescheduling
  if (task.cadence_type === 'once') {
    await supabase.from('tasks').update({
      status: 'completed',
      last_reminded_at_utc: null,
    }).eq('id', task.id);

    return formatOnceDone(task.title);
  }

  // RECURRING TASKS: calculate next due
  const nextDue = calculateNextDue(
    task.cadence_type,
    task.cadence_meta,
    task.reminder_time_local
  );
  const { date, time } = formatDateForSMS(nextDue);

  await supabase.from('tasks').update({
    next_due_at_utc: nextDue.toISOString(),
    snooze_until_utc: null,
    occurrence_snooze_count: 0,
    stuck: false,
    last_reminded_at_utc: null,
  }).eq('id', task.id);

  // Count completions
  const { count: taskCompletions } = await supabase
    .from('task_completions')
    .select('*', { count: 'exact', head: true })
    .eq('task_id', task.id)
    .eq('was_skipped', false);

  const { count: totalUserCompletions } = await supabase
    .from('task_completions')
    .select('*, tasks!inner(user_id)', { count: 'exact', head: true })
    .eq('tasks.user_id', user.id)
    .eq('was_skipped', false);

  // First ever DONE
  if ((totalUserCompletions || 0) === 1) {
    await supabase.from('users').update({
      first_done_at_utc: new Date().toISOString(),
    }).eq('id', user.id);
    return formatFirstDone(task.title, date, time);
  }

  // Streak
  if (taskCompletions && taskCompletions > 0 && taskCompletions % 4 === 0) {
    return formatStreak(task.title, taskCompletions, date, time);
  }

  return formatDoneConfirmation(task.title, date, time);
}

// ============================================================
// SKIP
// ============================================================
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

  if (!task) return formatNoPending();

  // One-off: skip = complete (no next occurrence)
  if (task.cadence_type === 'once') {
    await supabase.from('task_completions').insert({ task_id: task.id, was_skipped: true });
    await supabase.from('tasks').update({ status: 'completed', last_reminded_at_utc: null }).eq('id', task.id);
    return formatOnceDone(task.title);
  }

  const nextDue = calculateNextDue(task.cadence_type, task.cadence_meta, task.reminder_time_local);
  const { date, time } = formatDateForSMS(nextDue);

  await supabase.from('task_completions').insert({ task_id: task.id, was_skipped: true });
  await supabase.from('tasks').update({
    next_due_at_utc: nextDue.toISOString(),
    snooze_until_utc: null,
    occurrence_snooze_count: 0,
    stuck: false,
    last_reminded_at_utc: null,
  }).eq('id', task.id);

  return formatSkipConfirmation(task.title, date, time);
}

// ============================================================
// SNOOZE
// ============================================================
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

  if (!task) return formatNoPending();

  const newOccurrenceCount = (task.occurrence_snooze_count || 0) + 1;

  if (newOccurrenceCount >= 4) {
    await supabase.from('tasks').update({
      occurrence_snooze_count: newOccurrenceCount,
    }).eq('id', task.id);
    return formatComeback(task.title);
  }

  let snoozeUntil: Date;
  if (['1H', '3H', '1D'].includes(duration)) {
    snoozeUntil = calculateExplicitSnooze(duration as '1H' | '3H' | '1D', task.reminder_time_local);
  } else {
    snoozeUntil = calculateSmartSnooze();
  }

  const snoozeDisplay = formatSnoozeTimeForSMS(snoozeUntil);

  await supabase.from('tasks').update({
    snooze_until_utc: snoozeUntil.toISOString(),
    snooze_count: (task.snooze_count || 0) + 1,
    occurrence_snooze_count: newOccurrenceCount,
    last_reminded_at_utc: null,
  }).eq('id', task.id);

  return formatSnoozeConfirmation(task.title, newOccurrenceCount, snoozeDisplay);
}

// ============================================================
// STOP
// ============================================================
async function handleStop(supabase: any, user: any): Promise<string> {
  const { data: tasks } = await supabase
    .from('tasks')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'active');

  const count = tasks?.length || 0;
  if (count > 0) {
    await supabase.from('tasks').update({ status: 'paused' })
      .eq('user_id', user.id).eq('status', 'active');
  }

  return formatPauseConfirmation(count);
}

// ============================================================
// START/YES/RESUME
// ============================================================
async function handleResume(supabase: any, user: any): Promise<string> {
  const { data: tasks } = await supabase
    .from('tasks')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'paused');

  const count = tasks?.length || 0;
  if (count > 0) {
    await supabase.from('tasks').update({ status: 'active' })
      .eq('user_id', user.id).eq('status', 'paused');
  }

  return formatResumeConfirmation(count);
}
