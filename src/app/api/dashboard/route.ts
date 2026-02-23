import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const supabase = createServiceClient();

  // TODO: Get user from session/auth
  // For now, check auth header or cookie
  const authHeader = req.headers.get('authorization');

  // Get all tasks for the user
  // In production, this uses the authenticated user's ID
  // For now, we'll need the session to identify the user

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .neq('status', 'paused')
    .order('next_due_at_utc', { ascending: true });

  // Get completion count this month
  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);

  const { count: completedThisMonth } = await supabase
    .from('task_completions')
    .select('*', { count: 'exact', head: true })
    .in('task_id', (tasks || []).map(t => t.id))
    .gte('completed_at_utc', startOfMonth.toISOString())
    .eq('was_skipped', false);

  // Count overdue
  const now = new Date();
  const overdueCount = (tasks || []).filter(t => {
    if (t.status !== 'active') return false;
    const due = new Date(t.next_due_at_utc);
    return due < new Date(now.getTime() - 60 * 60 * 1000);
  }).length;

  // Get user plan
  const { data: user } = await supabase
    .from('users')
    .select('plan')
    .eq('id', userId)
    .single();

  return NextResponse.json({
    tasks: tasks || [],
    stats: {
      completedThisMonth: completedThisMonth || 0,
      overdueCount,
    },
    plan: user?.plan || 'free',
  });
}
