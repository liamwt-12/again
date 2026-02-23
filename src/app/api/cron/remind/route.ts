import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { sendSMS, formatReminder, formatOverdue } from '@/lib/sms';
import { formatDateForSMS, calculateOverdueDays } from '@/lib/scheduler';

export async function GET(req: NextRequest) {
  // Protect with CRON_SECRET
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const now = new Date();

  // Idempotent query — find tasks due for reminder
  // Multi-task queue: we'll process per-user, one at a time
  const { data: dueTasks, error } = await supabase
    .from('tasks')
    .select('*, users!inner(phone)')
    .lte('next_due_at_utc', now.toISOString())
    .eq('status', 'active')
    .eq('stuck', false)
    .or(`snooze_until_utc.is.null,snooze_until_utc.lte.${now.toISOString()}`)
    .lt('last_reminded_at_utc', new Date(now.getTime() - 23 * 60 * 60 * 1000).toISOString())
    .order('next_due_at_utc', { ascending: true });

  // Also get tasks that have never been reminded
  const { data: neverReminded } = await supabase
    .from('tasks')
    .select('*, users!inner(phone)')
    .lte('next_due_at_utc', now.toISOString())
    .eq('status', 'active')
    .eq('stuck', false)
    .is('last_reminded_at_utc', null)
    .or(`snooze_until_utc.is.null,snooze_until_utc.lte.${now.toISOString()}`)
    .order('next_due_at_utc', { ascending: true });

  const allTasks = [...(dueTasks || []), ...(neverReminded || [])];

  // Deduplicate by task id
  const uniqueTasks = allTasks.filter((task, index, self) =>
    index === self.findIndex(t => t.id === task.id)
  );

  // Group by user — only send one reminder per user (queue model)
  const userTaskMap = new Map<string, typeof uniqueTasks[0]>();
  for (const task of uniqueTasks) {
    if (!userTaskMap.has(task.user_id)) {
      userTaskMap.set(task.user_id, task);
    }
  }

  let sentCount = 0;

  for (const [userId, task] of userTaskMap) {
    const phone = (task as any).users?.phone;
    if (!phone) continue;

    const dueDate = new Date(task.next_due_at_utc);
    const overdueDays = calculateOverdueDays(dueDate, now);
    const isOverdue = overdueDays >= 1 || (now.getTime() - dueDate.getTime()) > 60 * 60 * 1000;

    // Check overdue escalation — mark stuck after 2 reminders on overdue tasks
    if (isOverdue && overdueDays >= 2) {
      await supabase.from('tasks').update({ stuck: true }).eq('id', task.id);

      // Log the stuck event
      await supabase.from('sms_events').insert({
        user_id: userId,
        task_id: task.id,
        direction: 'out',
        kind: 'system',
        body: `${task.title} marked as stuck after ${overdueDays} days overdue.`,
      });
      continue;
    }

    // Build SMS body
    let smsBody: string;
    if (isOverdue) {
      smsBody = formatOverdue(task.title, Math.max(1, overdueDays));
    } else {
      const { time } = formatDateForSMS(dueDate);
      smsBody = formatReminder(task.title, time);
    }

    // Log BEFORE sending (so failures are visible)
    await supabase.from('sms_events').insert({
      user_id: userId,
      task_id: task.id,
      direction: 'out',
      kind: isOverdue ? 'overdue' : 'reminder',
      body: smsBody,
    });

    // Send SMS
    const sid = await sendSMS(phone, smsBody);

    // Update last_reminded_at_utc immediately
    await supabase.from('tasks').update({
      last_reminded_at_utc: now.toISOString(),
    }).eq('id', task.id);

    if (sid) sentCount++;
  }

  return NextResponse.json({
    success: true,
    reminded: sentCount,
    timestamp: now.toISOString(),
  });
}
