create table if not exists public.affiliate_links (
  lus_user_id uuid primary key references auth.users (id) on delete cascade,
  handle text not null,
  whop_username text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint affiliate_links_handle_format check (handle ~ '^[a-z0-9_]{3,24}$')
);

create unique index if not exists affiliate_links_handle_unique
  on public.affiliate_links (lower(handle));

alter table public.affiliate_links enable row level security;
revoke all on public.affiliate_links from public, anon, authenticated, service_role;
grant select, insert, update on public.affiliate_links to service_role;
