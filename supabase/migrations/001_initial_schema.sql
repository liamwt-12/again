-- again — database schema
-- Run this as a Supabase migration
-- RLS on every table from the start

-- ============ USERS ============
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  phone text unique not null,
  timezone text default 'Europe/London',
  plan text default 'free' check (plan in ('free', 'pro')),
  stripe_customer_id text,
  first_done_at_utc timestamptz,  -- tracks when first DONE was received (for nudge timing)
  nudge_sent boolean default false,
  created_at timestamptz default now()
);

alter table public.users enable row level security;

create policy "Users can read own data" on public.users
  for select using (auth.uid() = id);

create policy "Users can update own data" on public.users
  for update using (auth.uid() = id);

-- ============ TASKS ============
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  title text not null,  -- stored uppercase
  cadence_type text not null check (cadence_type in ('daily', 'weekly', 'monthly')),
  cadence_meta jsonb default '{}',
  reminder_time_local text not null,  -- 'HH:MM'
  next_due_at_utc timestamptz,
  status text default 'active' check (status in ('active', 'paused', 'inactive')),
  snooze_until_utc timestamptz,
  snooze_count int default 0,
  occurrence_snooze_count int default 0,  -- resets on DONE/SKIP
  last_reminded_at_utc timestamptz,
  stuck boolean default false,  -- true after 2 overdue reminders
  created_at timestamptz default now()
);

alter table public.tasks enable row level security;

create policy "Users can read own tasks" on public.tasks
  for select using (user_id = auth.uid());

create policy "Users can insert own tasks" on public.tasks
  for insert with check (user_id = auth.uid());

create policy "Users can update own tasks" on public.tasks
  for update using (user_id = auth.uid());

-- Index for cron scheduler query
create index if not exists idx_tasks_due on public.tasks (next_due_at_utc, status, stuck)
  where status = 'active' and stuck = false;

-- ============ TASK COMPLETIONS ============
create table if not exists public.task_completions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references public.tasks(id) on delete cascade not null,
  completed_at_utc timestamptz default now(),
  was_skipped boolean default false
);

alter table public.task_completions enable row level security;

create policy "Users can read own completions" on public.task_completions
  for select using (
    task_id in (select id from public.tasks where user_id = auth.uid())
  );

create policy "Users can insert own completions" on public.task_completions
  for insert with check (
    task_id in (select id from public.tasks where user_id = auth.uid())
  );

-- ============ SMS EVENTS ============
create table if not exists public.sms_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  task_id uuid references public.tasks(id) on delete set null,
  direction text not null check (direction in ('in', 'out')),
  kind text not null check (kind in ('reminder', 'overdue', 'confirm', 'system', 'inbound', 'nudge')),
  body text,
  created_at_utc timestamptz default now(),
  provider_message_id text
);

alter table public.sms_events enable row level security;

create policy "Users can read own sms events" on public.sms_events
  for select using (user_id = auth.uid());

-- Index for SMS log queries
create index if not exists idx_sms_events_user on public.sms_events (user_id, created_at_utc desc);
