create table if not exists public.calendar_feed_tokens (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  membership_id uuid not null references public.business_memberships(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  token_digest text not null unique,
  created_at timestamptz not null default now(),
  last_accessed_at timestamptz,
  revoked_at timestamptz
);

create unique index if not exists calendar_feed_tokens_one_active_per_user
  on public.calendar_feed_tokens (business_id, user_id)
  where revoked_at is null;

alter table public.calendar_feed_tokens enable row level security;

drop policy if exists calendar_feed_tokens_select_own on public.calendar_feed_tokens;
create policy calendar_feed_tokens_select_own
on public.calendar_feed_tokens for select to authenticated
using (
  user_id = (select auth.uid())
  and (select private.is_active_member(business_id))
);

drop policy if exists calendar_feed_tokens_insert_own on public.calendar_feed_tokens;
create policy calendar_feed_tokens_insert_own
on public.calendar_feed_tokens for insert to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.business_memberships membership
    where membership.id = membership_id
      and membership.business_id = calendar_feed_tokens.business_id
      and membership.user_id = (select auth.uid())
      and membership.status = 'active'
  )
);

drop policy if exists calendar_feed_tokens_update_own on public.calendar_feed_tokens;
create policy calendar_feed_tokens_update_own
on public.calendar_feed_tokens for update to authenticated
using (
  user_id = (select auth.uid())
  and (select private.is_active_member(business_id))
)
with check (
  user_id = (select auth.uid())
  and (select private.is_active_member(business_id))
);

grant select, insert, update on public.calendar_feed_tokens to authenticated;
