import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

function normaliseUKPhone(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  if (digits.startsWith('0') && digits.length === 11) return '+44' + digits.slice(1);
  if (digits.startsWith('44') && digits.length === 12) return '+' + digits;
  if (input.startsWith('+44') && digits.length === 12) return '+' + digits;
  if (digits.startsWith('7') && digits.length === 10) return '+44' + digits;
  return null;
}

export async function GET(req: NextRequest) {
  const supabase = createServiceClient();

  // Get phone from cookie
  const phone = req.cookies.get('again_phone')?.value;
  if (!phone) {
    return NextResponse.json({ error: 'not logged in' }, { status: 401 });
  }

  const normalised = normaliseUKPhone(phone) || phone;

  // Get user
  const { data: user } = await supabase
    .from('users')
    .select('id, plan, phone')
    .eq('phone', normalised)
    .single();

  if (!user) {
    return NextResponse.json({ error: 'user not found' }, { status: 404 });
  }

  // Get tasks
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .order('next_due_at_utc', { ascending: true });

  // Completion count this month
  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);

  const taskIds = (tasks || []).map(t => t.id);
  let completedThisMonth = 0;

  if (taskIds.length > 0) {
    const { count } = await supabase
      .from('task_completions')
      .select('*', { count: 'exact', head: true })
      .in('task_id', taskIds)
      .gte('completed_at_utc', startOfMonth.toISOString())
      .eq('was_skipped', false);
    completedThisMonth = count || 0;
  }

  // Overdue count
  const now = new Date();
  const overdueCount = (tasks || []).filter(t => {
    if (t.status !== 'active') return false;
    return new Date(t.next_due_at_utc) < new Date(now.getTime() - 60 * 60 * 1000);
  }).length;

  return NextResponse.json({
    tasks: tasks || [],
    stats: { completedThisMonth, overdueCount },
    plan: user.plan || 'free',
    phone: user.phone,
  });
}
