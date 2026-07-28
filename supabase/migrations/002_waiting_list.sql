-- again — waiting list
-- Added 2026-07-28 when the product closed to new signups. The phone/OTP
-- onboarding flow was replaced by an email capture; this is where it lands.

create table if not exists public.waiting_list (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamptz default now()
);

-- RLS on, deliberately with no policies: the only writer is /api/waiting-list
-- using the service-role key. Anon and authenticated clients can neither read
-- nor write the list, so the email addresses are not publicly enumerable.
alter table public.waiting_list enable row level security;
