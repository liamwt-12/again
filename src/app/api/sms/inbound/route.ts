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
  formatDeleteConfirmation,
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

  // Look up user by phone
  let user: any = null;
  const { data: u1 } = await supabase
    .from('users').select('id, phone, plan').eq('phone', from).single();
  if (u1) {
    user = u1;
  } else {
    const altPhone = from.startsWith('+') ? from.slice(1) : `+${from}`;
    const { data: u2 } = await supabase
      .from('users').select('id, phone, plan').eq('phone', altPhone).single();
    if (u2) user = u2;
  }

  if (!user) {
    return emptyResponse();
  }

  await supabase.from('sms_events').insert({
    user_id: user.id, direction: 'in', kind: 'inbound', body,
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
  } else if (command === 'DELETE' || command === 'CANCEL' || command === 'REMOVE') {
    responseText = await handleDelete(supabase, user);
  } else if (command.startsWith('ADD ') || command === 'ADD') {
    responseText = await handleAdd(supabase, user, body.trim());
  } else if (isAddReply(command)) {
    responseText = await handleAddReply(supabase, user, body.trim());
  } else {
    responseText = formatInvalidCommand();
  }

  if (responseText) {
    await supabase.from('sms_events').insert({
      user_id: user.id, direction: 'out', kind: 'confirm', body: responseText,
    });
    await sendSMS(from, responseText);
  }

  return emptyResponse();
}

function emptyResponse() {
  return new NextResponse(
    '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
    { headers: { 'Content-Type': 'text/xml' } }
  );
}

// ============================================================
// ADD — text to create a task
// ============================================================
async function handleAdd(supabase: any, user: any, rawBody: string): Promise<string> {
  // Strip "ADD " prefix (case-insensitive)
  const afterAdd = rawBody.replace(/^add\s*/i, '').trim();

  if (!afterAdd) {
    return `what's the task? text ADD followed by the task name.\n\ne.g. ADD chase payments weekly 9am`;
  }

  // Try to parse: "task name cadence time"
  const parsed = parseAddCommand(afterAdd);

  if (parsed.title && parsed.cadence && parsed.time) {
    // Full command — create immediately
    return await createTaskFromSMS(supabase, user, parsed.title, parsed.cadence, parsed.time, parsed.onceDate);
  }

  if (parsed.title) {
    // Got a title but missing cadence/time — store pending and ask
    await supabase.from('users').update({
      pending_add_title: parsed.title.toUpperCase(),
      pending_add_step: 'cadence',
    }).eq('id', user.id);

    return `got it — ${parsed.title.toUpperCase()}.\n\nhow often? reply DAILY, WEEKLY, MONTHLY, or ONCE.`;
  }

  return `what's the task? text ADD followed by the task name.\n\ne.g. ADD chase payments weekly 9am`;
}

function parseAddCommand(text: string): { title: string; cadence: string | null; time: string | null; onceDate: string | null } {
  const lower = text.toLowerCase();
  let cadence: string | null = null;
  let time: string | null = null;
  let onceDate: string | null = null;
  let title = text;

  // Extract cadence
  const cadences = ['daily', 'weekly', 'monthly', 'once'];
  for (const c of cadences) {
    const idx = lower.indexOf(c);
    if (idx !== -1) {
      cadence = c;
      title = text.substring(0, idx).trim();
      const afterCadence = text.substring(idx + c.length).trim();
      // Try to extract time from remainder
      time = parseTime(afterCadence);
      break;
    }
  }

  // If no cadence found in text, whole thing is the title
  if (!cadence) {
    title = text;
  }

  return { title, cadence, time, onceDate };
}

function parseTime(text: string): string | null {
  if (!text) return null;
  const lower = text.toLowerCase().trim();

  // Match "9am", "9:00am", "9:00 am", "14:00", "2pm", "9:30am"
  const match = lower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
  if (!match) return null;

  let hours = parseInt(match[1]);
  const minutes = match[2] ? parseInt(match[2]) : 0;
  const period = match[3];

  if (period === 'pm' && hours < 12) hours += 12;
  if (period === 'am' && hours === 12) hours = 0;

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

async function createTaskFromSMS(
  supabase: any, user: any,
  title: string, cadence: string, time: string,
  onceDate: string | null
): Promise<string> {
  // Check task limit for free users
  const { count } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'active');

  const isOverLimit = user.plan === 'free' && (count || 0) >= 1;

  if (isOverLimit) {
    // Still create but inactive
    const nextDue = calculateNextDue(cadence as any, onceDate ? { once_date: onceDate } : null, time);
    await supabase.from('tasks').insert({
      user_id: user.id,
      title: title.toUpperCase(),
      cadence_type: cadence,
      cadence_meta: onceDate ? { once_date: onceDate } : {},
      reminder_time_local: time,
      next_due_at_utc: nextDue.toISOString(),
      status: 'inactive',
    });

    return `${title.toUpperCase()} added — but you've hit your free limit.\n\nupgrade for unlimited tasks:\ngetagain.co.uk/dashboard`;
  }

  const cadenceMeta = onceDate ? { once_date: onceDate } : {};
  const nextDue = calculateNextDue(cadence as any, cadenceMeta, time);
  const { date: nextDateStr, time: nextTimeStr } = formatDateForSMS(nextDue);

  await supabase.from('tasks').insert({
    user_id: user.id,
    title: title.toUpperCase(),
    cadence_type: cadence,
    cadence_meta: cadenceMeta,
    reminder_time_local: time,
    next_due_at_utc: nextDue.toISOString(),
    status: 'active',
  });

  // Clear any pending state
  await supabase.from('users').update({
    pending_add_title: null,
    pending_add_step: null,
  }).eq('id', user.id);

  if (cadence === 'once') {
    return `${title.toUpperCase()} added.\n\nreminder: ${nextDateStr} at ${nextTimeStr}.\none-off — we'll text you once then it's done.`;
  }

  return `${title.toUpperCase()} added.\n\n${cadence} at ${nextTimeStr}.\nnext: ${nextDateStr} at ${nextTimeStr}.`;
}

// Check if this looks like a reply to an ADD conversation
function isAddReply(command: string): boolean {
  const cadences = ['DAILY', 'WEEKLY', 'MONTHLY', 'ONCE'];
  if (cadences.includes(command)) return true;
  const isTimeReply = /^\d{1,2}(:\d{2})?\s*(AM|PM)?$/i.test(command);
  return isTimeReply;
}

async function handleAddReply(supabase: any, user: any, rawBody: string): Promise<string> {
  // Get pending state
  const { data: userData } = await supabase
    .from('users')
    .select('pending_add_title, pending_add_step')
    .eq('id', user.id)
    .single();

  if (!userData?.pending_add_title) {
    return formatInvalidCommand();
  }

  const command = rawBody.toUpperCase().trim();
  const title = userData.pending_add_title;

  if (userData.pending_add_step === 'cadence') {
    const cadences = ['DAILY', 'WEEKLY', 'MONTHLY', 'ONCE'];
    if (cadences.includes(command)) {
      await supabase.from('users').update({
        pending_add_step: 'time',
        pending_add_cadence: command.toLowerCase(),
      }).eq('id', user.id);

      return `${title} — ${command.toLowerCase()}.\n\nwhat time? e.g. 9am, 2:30pm, 14:00`;
    }
    return `reply DAILY, WEEKLY, MONTHLY, or ONCE.`;
  }

  if (userData.pending_add_step === 'time') {
    const { data: ud } = await supabase
      .from('users')
      .select('pending_add_cadence')
      .eq('id', user.id)
      .single();

    const time = parseTime(rawBody);
    if (!time) {
      return `didn't catch that. try: 9am, 2:30pm, or 14:00`;
    }

    const cadence = ud?.pending_add_cadence || 'daily';

    // Clear pending state
    await supabase.from('users').update({
      pending_add_title: null,
      pending_add_step: null,
      pending_add_cadence: null,
    }).eq('id', user.id);

    return await createTaskFromSMS(supabase, user, title, cadence, time, null);
  }

  return formatInvalidCommand();
}

// ============================================================
// DELETE — remove most recently reminded task
// ============================================================
async function handleDelete(supabase: any, user: any): Promise<string> {
  // First try: most recently reminded active task
  let { data: task } = await supabase
    .from('tasks').select('*')
    .eq('user_id', user.id).eq('status', 'active')
    .not('last_reminded_at_utc', 'is', null)
    .order('last_reminded_at_utc', { ascending: false })
    .limit(1).single();

  // Fallback: most recently created active task
  if (!task) {
    const { data: t2 } = await supabase
      .from('tasks').select('*')
      .eq('user_id', user.id).eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1).single();
    task = t2;
  }

  if (!task) {
    return `no active tasks to delete.`;
  }

  // Delete the task
  await supabase.from('tasks').delete().eq('id', task.id);

  // Check if they have tasks left
  const { count } = await supabase
    .from('tasks').select('*', { count: 'exact', head: true })
    .eq('user_id', user.id).eq('status', 'active');

  return formatDeleteConfirmation(task.title, (count || 0) > 0);
}

// ============================================================
// DONE
// ============================================================
async function handleDone(supabase: any, user: any): Promise<string> {
  const { data: task } = await supabase
    .from('tasks').select('*')
    .eq('user_id', user.id).eq('status', 'active')
    .not('last_reminded_at_utc', 'is', null)
    .order('last_reminded_at_utc', { ascending: false })
    .limit(1).single();

  if (!task) return formatNoPending();

  await supabase.from('task_completions').insert({ task_id: task.id, was_skipped: false });

  // One-off: mark completed
  if (task.cadence_type === 'once') {
    await supabase.from('tasks').update({
      status: 'completed', last_reminded_at_utc: null,
    }).eq('id', task.id);
    return formatOnceDone(task.title);
  }

  const nextDue = calculateNextDue(task.cadence_type, task.cadence_meta, task.reminder_time_local);
  const { date, time } = formatDateForSMS(nextDue);

  await supabase.from('tasks').update({
    next_due_at_utc: nextDue.toISOString(),
    snooze_until_utc: null, occurrence_snooze_count: 0,
    stuck: false, last_reminded_at_utc: null,
  }).eq('id', task.id);

  const { count: taskCompletions } = await supabase
    .from('task_completions').select('*', { count: 'exact', head: true })
    .eq('task_id', task.id).eq('was_skipped', false);

  const { count: totalUserCompletions } = await supabase
    .from('task_completions').select('*, tasks!inner(user_id)', { count: 'exact', head: true })
    .eq('tasks.user_id', user.id).eq('was_skipped', false);

  if ((totalUserCompletions || 0) === 1) {
    await supabase.from('users').update({ first_done_at_utc: new Date().toISOString() }).eq('id', user.id);
    return formatFirstDone(task.title, date, time);
  }

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
    .from('tasks').select('*')
    .eq('user_id', user.id).eq('status', 'active')
    .not('last_reminded_at_utc', 'is', null)
    .order('last_reminded_at_utc', { ascending: false })
    .limit(1).single();

  if (!task) return formatNoPending();

  if (task.cadence_type === 'once') {
    await supabase.from('task_completions').insert({ task_id: task.id, was_skipped: true });
    await supabase.from('tasks').update({ status: 'completed', last_reminded_at_utc: null }).eq('id', task.id);
    return formatOnceDone(task.title);
  }

  const nextDue = calculateNextDue(task.cadence_type, task.cadence_meta, task.reminder_time_local);
  const { date, time } = formatDateForSMS(nextDue);

  await supabase.from('task_completions').insert({ task_id: task.id, was_skipped: true });
  await supabase.from('tasks').update({
    next_due_at_utc: nextDue.toISOString(), snooze_until_utc: null,
    occurrence_snooze_count: 0, stuck: false, last_reminded_at_utc: null,
  }).eq('id', task.id);

  return formatSkipConfirmation(task.title, date, time);
}

// ============================================================
// SNOOZE
// ============================================================
async function handleSnooze(supabase: any, user: any, duration: string): Promise<string> {
  const { data: task } = await supabase
    .from('tasks').select('*')
    .eq('user_id', user.id).eq('status', 'active')
    .not('last_reminded_at_utc', 'is', null)
    .order('last_reminded_at_utc', { ascending: false })
    .limit(1).single();

  if (!task) return formatNoPending();

  const newOccurrenceCount = (task.occurrence_snooze_count || 0) + 1;

  if (newOccurrenceCount >= 4) {
    await supabase.from('tasks').update({ occurrence_snooze_count: newOccurrenceCount }).eq('id', task.id);
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
// STOP / RESUME
// ============================================================
async function handleStop(supabase: any, user: any): Promise<string> {
  const { data: tasks } = await supabase
    .from('tasks').select('id').eq('user_id', user.id).eq('status', 'active');
  const count = tasks?.length || 0;
  if (count > 0) {
    await supabase.from('tasks').update({ status: 'paused' }).eq('user_id', user.id).eq('status', 'active');
  }
  return formatPauseConfirmation(count);
}

async function handleResume(supabase: any, user: any): Promise<string> {
  const { data: tasks } = await supabase
    .from('tasks').select('id').eq('user_id', user.id).eq('status', 'paused');
  const count = tasks?.length || 0;
  if (count > 0) {
    await supabase.from('tasks').update({ status: 'active' }).eq('user_id', user.id).eq('status', 'paused');
  }
  return formatResumeConfirmation(count);
}
