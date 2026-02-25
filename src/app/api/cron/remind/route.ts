import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import {
  sendSMS,
  formatReminder,
  formatOverdue,
  formatMondayBriefing,
  formatNudge,
  formatSilentCheckin,
} from '@/lib/sms';
import { formatDateForSMS, calculateOverdueDays } from '@/lib/scheduler';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const now = new Date();
  const hour = now.getUTCHours();
  const dayOfWeek = now.getUTCDay(); // 0 = Sunday, 1 = Monday

  let sentCount = 0;

  // ============================================================
  // MONDAY BRIEFING — 7am UTC on Mondays
  // ============================================================
  if (dayOfWeek === 1 && hour === 7) {
    await sendMondayBriefings(supabase, now);
  }

  // ============================================================
  // NUDGE — check for users who completed first task 24-48h ago
  // ============================================================
  await sendNudges(supabase, now);

  // ============================================================
  // SILENT CHECK-IN — users with no activity for 7+ days
  // ============================================================
  if (hour === 10) { // Only check once a day at 10am UTC
    await sendSilentCheckins(supabase, now);
  }

  // ============================================================
  // TASK REMINDERS — the core loop
  // ============================================================

  // Find tasks due now that haven't been reminded recently
  const { data: dueTasks } = await supabase
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
  const uniqueTasks = allTasks.filter((task, index, self) =>
    index === self.findIndex(t => t.id === task.id)
  );

  // Group by user — one reminder per user per cron run
  const userTaskMap = new Map<string, typeof uniqueTasks[0]>();
  for (const task of uniqueTasks) {
    if (!userTaskMap.has(task.user_id)) {
      userTaskMap.set(task.user_id, task);
    }
  }

  for (const [userId, task] of userTaskMap) {
    const phone = (task as any).users?.phone;
    if (!phone) continue;

    const dueDate = new Date(task.next_due_at_utc);
    const overdueDays = calculateOverdueDays(dueDate, now);
    const isOverdue = overdueDays >= 1 || (now.getTime() - dueDate.getTime()) > 60 * 60 * 1000;

    // Mark stuck after 2 days overdue
    if (isOverdue && overdueDays >= 2) {
      await supabase.from('tasks').update({ stuck: true }).eq('id', task.id);
      await supabase.from('sms_events').insert({
        user_id: userId,
        task_id: task.id,
        direction: 'out',
        kind: 'system',
        body: `${task.title} marked as stuck after ${overdueDays} days overdue.`,
      });
      continue;
    }

    let smsBody: string;
    if (isOverdue) {
      smsBody = formatOverdue(task.title, Math.max(1, overdueDays));
    } else {
      const { time } = formatDateForSMS(dueDate);
      smsBody = formatReminder(task.title, time);
    }

    await supabase.from('sms_events').insert({
      user_id: userId,
      task_id: task.id,
      direction: 'out',
      kind: isOverdue ? 'overdue' : 'reminder',
      body: smsBody,
    });

    const sid = await sendSMS(phone, smsBody);
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

// ============================================================
// MONDAY BRIEFING
// ============================================================
async function sendMondayBriefings(supabase: any, now: Date) {
  // Get all users with 2+ active tasks
  const { data: users } = await supabase
    .from('users')
    .select('id, phone');

  if (!users) return;

  for (const user of users) {
    const { data: tasks } = await supabase
      .from('tasks')
      .select('title, cadence_type, cadence_meta, next_due_at_utc')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('next_due_at_utc', { ascending: true });

    if (!tasks || tasks.length < 2) continue;

    // Get tasks due this week (next 7 days)
    const weekEnd = new Date(now);
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);

    const thisWeek = tasks
      .filter((t: any) => new Date(t.next_due_at_utc) <= weekEnd)
      .map((t: any) => {
        const due = new Date(t.next_due_at_utc);
        const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        return { title: t.title, day: days[due.getUTCDay()] };
      });

    if (thisWeek.length === 0) continue;

    const briefing = formatMondayBriefing(thisWeek);

    await supabase.from('sms_events').insert({
      user_id: user.id,
      direction: 'out',
      kind: 'briefing',
      body: briefing,
    });

    await sendSMS(user.phone, briefing);
  }
}

// ============================================================
// NUDGE — 24-48h after first DONE
// ============================================================
async function sendNudges(supabase: any, now: Date) {
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  // Find users who completed their first task 24-48h ago and haven't been nudged
  const { data: users } = await supabase
    .from('users')
    .select('id, phone')
    .not('first_done_at_utc', 'is', null)
    .lte('first_done_at_utc', oneDayAgo.toISOString())
    .gte('first_done_at_utc', twoDaysAgo.toISOString())
    .eq('nudge_sent', false);

  if (!users) return;

  for (const user of users) {
    // Check they still only have 1 task
    const { count } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if ((count || 0) > 1) {
      // They already added another task, mark nudge as sent
      await supabase.from('users').update({ nudge_sent: true }).eq('id', user.id);
      continue;
    }

    const nudge = formatNudge();

    await supabase.from('sms_events').insert({
      user_id: user.id,
      direction: 'out',
      kind: 'nudge',
      body: nudge,
    });

    await sendSMS(user.phone, nudge);
    await supabase.from('users').update({ nudge_sent: true }).eq('id', user.id);
  }
}

// ============================================================
// SILENT CHECK-IN — 7 days no activity
// ============================================================
async function sendSilentCheckins(supabase: any, now: Date) {
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const eightDaysAgo = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000);

  // Find users whose last SMS interaction was 7-8 days ago
  // (the 8-day window prevents sending multiple check-ins)
  const { data: users } = await supabase
    .from('users')
    .select('id, phone');

  if (!users) return;

  for (const user of users) {
    // Get last inbound SMS
    const { data: lastInbound } = await supabase
      .from('sms_events')
      .select('created_at_utc')
      .eq('user_id', user.id)
      .eq('direction', 'in')
      .order('created_at_utc', { ascending: false })
      .limit(1)
      .single();

    if (!lastInbound) continue;

    const lastActivity = new Date(lastInbound.created_at_utc);

    // Only send if last activity was 7-8 days ago
    if (lastActivity <= sevenDaysAgo && lastActivity >= eightDaysAgo) {
      // Check we haven't already sent a check-in recently
      const { data: recentCheckin } = await supabase
        .from('sms_events')
        .select('id')
        .eq('user_id', user.id)
        .eq('kind', 'checkin')
        .gte('created_at_utc', sevenDaysAgo.toISOString())
        .limit(1)
        .single();

      if (recentCheckin) continue;

      const checkin = formatSilentCheckin();

      await supabase.from('sms_events').insert({
        user_id: user.id,
        direction: 'out',
        kind: 'checkin',
        body: checkin,
      });

      await sendSMS(user.phone, checkin);
    }
  }
}
