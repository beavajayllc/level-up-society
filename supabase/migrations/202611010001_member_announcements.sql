create table if not exists public.announcement_admins (
  lus_user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.member_announcements (
  id uuid primary key default gen_random_uuid(),
  body text not null check (char_length(btrim(body)) between 1 and 1000),
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);

alter table public.announcement_admins enable row level security;
alter table public.member_announcements enable row level security;
revoke all on public.announcement_admins from public, anon, authenticated, service_role;
revoke all on public.member_announcements from public, anon, authenticated, service_role;
grant select on public.announcement_admins to service_role;
grant select, insert, delete on public.member_announcements to service_role;
