import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { calculateNextDue, calculateSmartSnooze } from '@/lib/scheduler';

export async function POST(req: NextRequest) {
  const { taskId, action } = await req.json();
  const supabase = createServiceClient();

  const { data: task } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .single();

  if (!task) {
    return NextResponse.json({ error: 'task not found' }, { status: 404 });
  }

  switch (action) {
    case 'done': {
      const nextDue = calculateNextDue(task.cadence_type, task.cadence_meta, task.reminder_time_local);
      await supabase.from('task_completions').insert({ task_id: task.id, was_skipped: false });
      await supabase.from('tasks').update({
        next_due_at_utc: nextDue.toISOString(),
        snooze_until_utc: null,
        occurrence_snooze_count: 0,
        stuck: false,
        last_reminded_at_utc: null,
      }).eq('id', task.id);
      break;
    }

    case 'skip': {
      const nextDue = calculateNextDue(task.cadence_type, task.cadence_meta, task.reminder_time_local);
      await supabase.from('task_completions').insert({ task_id: task.id, was_skipped: true });
      await supabase.from('tasks').update({
        next_due_at_utc: nextDue.toISOString(),
        snooze_until_utc: null,
        occurrence_snooze_count: 0,
        stuck: false,
        last_reminded_at_utc: null,
      }).eq('id', task.id);
      break;
    }

    case 'snooze': {
      const snoozeUntil = calculateSmartSnooze();
      await supabase.from('tasks').update({
        snooze_until_utc: snoozeUntil.toISOString(),
        snooze_count: (task.snooze_count || 0) + 1,
        occurrence_snooze_count: (task.occurrence_snooze_count || 0) + 1,
        last_reminded_at_utc: null,
      }).eq('id', task.id);
      break;
    }

    case 'pause': {
      await supabase.from('tasks').update({ status: 'paused' }).eq('id', task.id);
      break;
    }

    default:
      return NextResponse.json({ error: 'unknown action' }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
