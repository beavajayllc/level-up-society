create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_format check (username ~ '^[a-z0-9_]{3,24}$')
);

create unique index if not exists profiles_username_unique
  on public.profiles (lower(username));

alter table public.profiles enable row level security;
revoke all on public.profiles from public, anon, authenticated, service_role;
drop policy if exists "Users can read their own profile" on public.profiles;
grant select on public.profiles to service_role;

create table if not exists public.whop_accounts (
  lus_user_id uuid primary key references auth.users (id) on delete cascade,
  whop_user_id text not null unique,
  user_info jsonb not null,
  credentials_ciphertext text not null,
  token_obtained_at bigint not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.whop_accounts enable row level security;
revoke all on public.whop_accounts from public, anon, authenticated, service_role;
grant select, insert, update on public.whop_accounts to service_role;

create or replace function public.create_lus_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_username text;
begin
  requested_username := lower(btrim(new.raw_user_meta_data ->> 'username'));
  if requested_username is null or requested_username !~ '^[a-z0-9_]{3,24}$' then
    raise exception 'A valid Level Up Society username is required.';
  end if;

  insert into public.profiles (id, username)
  values (new.id, requested_username);
  return new;
end;
$$;

revoke all on function public.create_lus_profile() from public, anon, authenticated;
drop trigger if exists on_auth_user_created_lus_profile on auth.users;
create trigger on_auth_user_created_lus_profile
  after insert on auth.users
  for each row execute procedure public.create_lus_profile();
