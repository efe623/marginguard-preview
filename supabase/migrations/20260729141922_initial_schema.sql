create extension if not exists pgcrypto;

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create type public.membership_role as enum ('owner', 'staff');
create type public.membership_status as enum ('invited', 'active', 'suspended', 'removed');
create type public.project_status as enum (
  'draft',
  'active',
  'awaiting_approval',
  'awaiting_deposit',
  'authorized',
  'completed',
  'archived'
);
create type public.change_order_status as enum (
  'draft',
  'sent',
  'approved',
  'rejected',
  'awaiting_deposit',
  'authorized',
  'balance_due',
  'paid',
  'cancelled',
  'superseded'
);
create type public.payment_request_kind as enum ('deposit', 'balance');
create type public.payment_status as enum (
  'pending',
  'link_created',
  'processing',
  'confirmed',
  'failed',
  'expired',
  'cancelled'
);

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 100),
  timezone text not null default 'UTC',
  locale text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 160),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  timezone text not null default 'UTC',
  country_code text check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  deleted_at timestamptz,
  purge_after timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint businesses_deletion_window check (
    (deleted_at is null and purge_after is null)
    or (deleted_at is not null and purge_after is not null and purge_after >= deleted_at)
  )
);

create table public.business_memberships (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.membership_role not null,
  status public.membership_status not null default 'invited',
  send_financial_documents boolean not null default false,
  joined_at timestamptz,
  removed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, user_id),
  unique (business_id, id),
  constraint owner_has_no_delegated_send_flag check (
    role <> 'owner' or send_financial_documents = false
  )
);

create unique index business_one_active_owner_idx
  on public.business_memberships (business_id)
  where role = 'owner' and status = 'active';
create index business_memberships_user_active_idx
  on public.business_memberships (user_id, business_id)
  where status = 'active';

create or replace function private.enforce_five_seat_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status in ('invited', 'active') then
    perform 1 from public.businesses where id = new.business_id for update;
    if (
      select count(*)
      from public.business_memberships membership
      where membership.business_id = new.business_id
        and membership.status in ('invited', 'active')
        and membership.id <> new.id
    ) >= 5 then
      raise exception 'The free plan supports at most five seats'
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end;
$$;

create trigger business_memberships_five_seat_limit
before insert or update of business_id, status
on public.business_memberships
for each row execute function private.enforce_five_seat_limit();

create table public.business_invitations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  email text not null,
  role public.membership_role not null default 'staff',
  token_digest text not null unique,
  invited_by uuid not null references auth.users(id),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint invitations_future_expiry check (expires_at > created_at)
);
create index business_invitations_business_idx
  on public.business_invitations (business_id, created_at desc);

create or replace function private.enforce_invitation_seat_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.accepted_at is null and new.revoked_at is null and new.expires_at > now() then
    perform 1 from public.businesses where id = new.business_id for update;
    if (
      (select count(*) from public.business_memberships membership
       where membership.business_id = new.business_id
         and membership.status in ('invited', 'active'))
      +
      (select count(*) from public.business_invitations invitation
       where invitation.business_id = new.business_id
         and invitation.id <> new.id
         and invitation.accepted_at is null
         and invitation.revoked_at is null
         and invitation.expires_at > now())
    ) >= 5 then
      raise exception 'The free plan supports at most five seats including pending invitations'
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end;
$$;

create trigger business_invitations_five_seat_limit
before insert or update of business_id, accepted_at, revoked_at, expires_at
on public.business_invitations
for each row execute function private.enforce_invitation_seat_limit();

create table public.app_sessions (
  session_id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  trusted_until timestamptz,
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz,
  user_agent text,
  ip_hash text,
  created_at timestamptz not null default now()
);
create index app_sessions_user_active_idx
  on public.app_sessions (user_id, last_seen_at desc)
  where revoked_at is null;

create table public.recovery_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  code_digest text not null unique,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index recovery_codes_user_unused_idx
  on public.recovery_codes (user_id)
  where used_at is null;

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 180),
  primary_email text,
  phone text,
  location text,
  notes text,
  deleted_at timestamptz,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, id)
);
create index clients_business_active_idx
  on public.clients (business_id, name)
  where deleted_at is null;

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  client_id uuid not null,
  code text not null,
  name text not null check (char_length(name) between 1 and 180),
  status public.project_status not null default 'draft',
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  quote_amount_minor bigint not null check (quote_amount_minor >= 0),
  pricing_method text not null check (pricing_method in ('hourly', 'fixed')),
  hourly_rate_minor bigint check (hourly_rate_minor is null or hourly_rate_minor > 0),
  revision_limit integer not null check (revision_limit >= 0),
  deleted_at timestamptz,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, id),
  unique (business_id, code),
  foreign key (business_id, client_id)
    references public.clients (business_id, id)
    on delete restrict,
  constraint hourly_method_requires_rate check (
    pricing_method <> 'hourly' or hourly_rate_minor is not null
  )
);
create index projects_business_status_idx
  on public.projects (business_id, status, updated_at desc)
  where deleted_at is null;
create index projects_client_idx on public.projects (business_id, client_id);

create or replace function private.enforce_active_project_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.deleted_at is null and new.status not in ('completed', 'archived') then
    perform 1 from public.businesses where id = new.business_id for update;
    if (
      select count(*)
      from public.projects project
      where project.business_id = new.business_id
        and project.deleted_at is null
        and project.status not in ('completed', 'archived')
        and project.id <> new.id
    ) >= 25 then
      raise exception 'The free plan supports at most 25 active projects'
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end;
$$;

create trigger projects_active_limit
before insert or update of business_id, status, deleted_at
on public.projects
for each row execute function private.enforce_active_project_limit();

create table public.project_assignments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  project_id uuid not null,
  membership_id uuid not null,
  assigned_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique (project_id, membership_id),
  foreign key (business_id, project_id)
    references public.projects (business_id, id)
    on delete cascade,
  foreign key (business_id, membership_id)
    references public.business_memberships (business_id, id)
    on delete cascade
);
create index project_assignments_membership_idx
  on public.project_assignments (membership_id, project_id);
create index project_assignments_project_idx
  on public.project_assignments (project_id, membership_id);

create table public.project_scopes (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  project_id uuid not null,
  version integer not null check (version > 0),
  timeline_text text not null,
  revision_limit integer not null check (revision_limit >= 0),
  pricing_method text not null check (pricing_method in ('hourly', 'fixed')),
  hourly_rate_minor bigint check (hourly_rate_minor is null or hourly_rate_minor > 0),
  confirmed_at timestamptz,
  confirmed_by uuid references auth.users(id),
  superseded_at timestamptz,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique (project_id, version),
  unique (business_id, id),
  foreign key (business_id, project_id)
    references public.projects (business_id, id)
    on delete cascade
);
create unique index project_one_current_scope_idx
  on public.project_scopes (project_id)
  where superseded_at is null;
create index project_scopes_project_idx
  on public.project_scopes (project_id, version desc);

create table public.scope_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  scope_id uuid not null,
  kind text not null check (kind in ('deliverable', 'exclusion')),
  title text not null check (char_length(title) between 1 and 240),
  description text not null,
  position integer not null check (position >= 0),
  created_at timestamptz not null default now(),
  foreign key (business_id, scope_id)
    references public.project_scopes (business_id, id)
    on delete cascade
);
create index scope_items_scope_position_idx
  on public.scope_items (scope_id, position);

create table public.project_files (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  project_id uuid not null,
  storage_path text not null unique,
  original_name text not null,
  content_type text not null,
  size_bytes bigint not null check (size_bytes between 1 and 20971520),
  sha256 text,
  scan_status text not null default 'quarantined'
    check (scan_status in ('quarantined', 'scanning', 'clean', 'rejected', 'failed')),
  scan_detail text,
  uploaded_by uuid not null references auth.users(id),
  scanned_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (business_id, project_id)
    references public.projects (business_id, id)
    on delete cascade
);
create index project_files_project_active_idx
  on public.project_files (project_id, created_at desc)
  where deleted_at is null;

create table public.change_requests (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  project_id uuid not null,
  scope_item_id uuid references public.scope_items(id) on delete set null,
  title text not null check (char_length(title) between 1 and 240),
  request_type text not null check (request_type in ('new_request', 'revision', 'approval', 'promise')),
  source_type text not null check (source_type in ('whatsapp', 'email', 'meeting_note', 'other')),
  source_excerpt text,
  internal_note text,
  occurred_at timestamptz,
  evidence_attached boolean not null default false,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, id),
  foreign key (business_id, project_id)
    references public.projects (business_id, id)
    on delete cascade
);
create index change_requests_project_idx
  on public.change_requests (project_id, created_at desc);

create table public.revision_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  project_id uuid not null,
  change_request_id uuid references public.change_requests(id) on delete set null,
  revision_number integer not null check (revision_number > 0),
  title text not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique (project_id, revision_number),
  foreign key (business_id, project_id)
    references public.projects (business_id, id)
    on delete cascade
);
create index revision_events_project_idx
  on public.revision_events (project_id, revision_number desc);

create table public.revision_overrides (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  project_id uuid not null,
  revision_event_id uuid not null references public.revision_events(id) on delete cascade,
  reason text not null check (char_length(reason) between 5 and 1000),
  authorized_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  foreign key (business_id, project_id)
    references public.projects (business_id, id)
    on delete cascade
);

create table public.change_order_drafts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  project_id uuid not null,
  change_request_id uuid references public.change_requests(id) on delete set null,
  title text not null,
  reason text not null,
  description text not null,
  amount_minor bigint not null check (amount_minor > 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  deposit_basis_points integer not null check (deposit_basis_points between 100 and 10000),
  timeline_impact text not null,
  evidence_warning boolean not null default false,
  created_by uuid not null references auth.users(id),
  updated_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, id),
  foreign key (business_id, project_id)
    references public.projects (business_id, id)
    on delete cascade
);
create index change_order_drafts_project_idx
  on public.change_order_drafts (project_id, updated_at desc);

create table public.change_order_versions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  project_id uuid not null,
  draft_id uuid not null,
  order_number integer not null check (order_number > 0),
  version integer not null check (version > 0),
  status public.change_order_status not null default 'sent',
  snapshot jsonb not null,
  content_hash text not null,
  amount_minor bigint not null check (amount_minor > 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  deposit_basis_points integer not null check (deposit_basis_points between 100 and 10000),
  sent_by uuid not null references auth.users(id),
  sent_at timestamptz not null default now(),
  superseded_at timestamptz,
  created_at timestamptz not null default now(),
  unique (business_id, id),
  unique (business_id, order_number, version),
  foreign key (business_id, project_id)
    references public.projects (business_id, id)
    on delete cascade,
  foreign key (business_id, draft_id)
    references public.change_order_drafts (business_id, id)
    on delete restrict
);
create index change_order_versions_project_status_idx
  on public.change_order_versions (project_id, status, sent_at desc);
create unique index change_order_one_current_version_idx
  on public.change_order_versions (business_id, order_number)
  where superseded_at is null;

create table public.client_access_tokens (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  change_order_version_id uuid not null,
  token_digest text not null unique,
  client_email text not null,
  expires_at timestamptz not null,
  verified_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (business_id, change_order_version_id)
    references public.change_order_versions (business_id, id)
    on delete cascade,
  constraint client_tokens_future_expiry check (expires_at > created_at)
);
create index client_access_tokens_version_idx
  on public.client_access_tokens (change_order_version_id);

create table public.client_otp_challenges (
  id uuid primary key default gen_random_uuid(),
  token_id uuid not null references public.client_access_tokens(id) on delete cascade,
  otp_digest text not null,
  attempt_count integer not null default 0 check (attempt_count between 0 and 6),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);
create index client_otp_token_active_idx
  on public.client_otp_challenges (token_id, created_at desc)
  where consumed_at is null;

create table public.change_order_approvals (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  change_order_version_id uuid not null,
  token_id uuid not null references public.client_access_tokens(id),
  decision text not null check (decision in ('approved', 'rejected')),
  verified_email text not null,
  content_hash text not null,
  decided_at timestamptz not null default now(),
  ip_hash text,
  user_agent text,
  unique (change_order_version_id),
  foreign key (business_id, change_order_version_id)
    references public.change_order_versions (business_id, id)
    on delete restrict
);
create index change_order_approvals_business_idx
  on public.change_order_approvals (business_id, decided_at desc);

create table public.stripe_connections (
  business_id uuid primary key references public.businesses(id) on delete cascade,
  stripe_account_id text not null unique,
  connected_by uuid not null references auth.users(id),
  charges_enabled boolean not null default false,
  disconnected_at timestamptz,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.payment_requests (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  change_order_version_id uuid not null,
  kind public.payment_request_kind not null,
  amount_minor bigint not null check (amount_minor > 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  status public.payment_status not null default 'pending',
  stripe_payment_link_id text unique,
  stripe_payment_link_url text,
  requested_by uuid references auth.users(id),
  requested_at timestamptz not null default now(),
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  unique (change_order_version_id, kind),
  foreign key (business_id, change_order_version_id)
    references public.change_order_versions (business_id, id)
    on delete restrict
);
create index payment_requests_business_status_idx
  on public.payment_requests (business_id, status, requested_at desc);

create or replace function public.record_client_decision(
  p_token_id uuid,
  p_decision text,
  p_ip_hash text default null,
  p_user_agent text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  token_row public.client_access_tokens%rowtype;
  version_row public.change_order_versions%rowtype;
  approval_id uuid;
  deposit_amount bigint;
begin
  if p_decision not in ('approved', 'rejected') then
    raise exception 'Invalid decision' using errcode = 'check_violation';
  end if;

  select *
  into token_row
  from public.client_access_tokens
  where id = p_token_id
  for update;

  if not found
    or token_row.revoked_at is not null
    or token_row.verified_at is null
    or token_row.expires_at <= now()
  then
    raise exception 'Approval token is invalid or expired' using errcode = 'invalid_authorization_specification';
  end if;

  select *
  into version_row
  from public.change_order_versions
  where id = token_row.change_order_version_id
  for update;

  if not found or version_row.status <> 'sent' or version_row.superseded_at is not null then
    raise exception 'Change Order version is no longer current' using errcode = 'object_not_in_prerequisite_state';
  end if;

  insert into public.change_order_approvals (
    business_id,
    change_order_version_id,
    token_id,
    decision,
    verified_email,
    content_hash,
    ip_hash,
    user_agent
  )
  values (
    token_row.business_id,
    version_row.id,
    token_row.id,
    p_decision,
    token_row.client_email,
    version_row.content_hash,
    p_ip_hash,
    left(p_user_agent, 1000)
  )
  returning id into approval_id;

  if p_decision = 'approved' then
    update public.change_order_versions
    set status = 'awaiting_deposit'
    where id = version_row.id;

    deposit_amount := greatest(
      1,
      round((version_row.amount_minor * version_row.deposit_basis_points)::numeric / 10000)::bigint
    );
    insert into public.payment_requests (
      business_id,
      change_order_version_id,
      kind,
      amount_minor,
      currency,
      requested_by
    )
    values (
      token_row.business_id,
      version_row.id,
      'deposit',
      deposit_amount,
      version_row.currency,
      null
    );
  else
    update public.change_order_versions
    set status = 'rejected'
    where id = version_row.id;
  end if;

  update public.client_access_tokens
  set revoked_at = now()
  where id = token_row.id;

  return approval_id;
end;
$$;

revoke all on function public.record_client_decision(uuid, text, text, text)
from public, anon, authenticated;
grant execute on function public.record_client_decision(uuid, text, text, text)
to service_role;

create table public.manual_payment_confirmations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  payment_request_id uuid not null unique references public.payment_requests(id) on delete restrict,
  amount_minor bigint not null check (amount_minor > 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  payment_method text not null,
  reference text,
  receipt_file_id uuid references public.project_files(id) on delete set null,
  confirmed_by uuid not null references auth.users(id),
  confirmed_at timestamptz not null default now()
);
create index manual_payments_business_idx
  on public.manual_payment_confirmations (business_id, confirmed_at desc);

create table public.stripe_events (
  stripe_event_id text primary key,
  stripe_account_id text not null,
  event_type text not null,
  payload jsonb not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  processing_error text
);
create index stripe_events_unprocessed_idx
  on public.stripe_events (received_at)
  where processed_at is null;

create table public.audit_events (
  id bigint generated always as identity primary key,
  business_id uuid not null references public.businesses(id) on delete restrict,
  project_id uuid references public.projects(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  subject_type text not null,
  subject_id text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);
create index audit_events_business_time_idx
  on public.audit_events (business_id, occurred_at desc, id desc);
create index audit_events_project_time_idx
  on public.audit_events (project_id, occurred_at desc, id desc)
  where project_id is not null;

create table public.ownership_transfers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  from_user_id uuid not null references auth.users(id),
  to_user_id uuid not null references auth.users(id),
  token_digest text not null unique,
  initiated_at timestamptz not null default now(),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  cancelled_at timestamptz,
  constraint ownership_transfer_distinct_users check (from_user_id <> to_user_id)
);
create unique index ownership_one_pending_idx
  on public.ownership_transfers (business_id)
  where accepted_at is null and cancelled_at is null;

create table public.support_access_grants (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  support_user_id uuid not null references auth.users(id),
  project_id uuid references public.projects(id) on delete cascade,
  reason text not null check (char_length(reason) between 10 and 1000),
  granted_by uuid not null references auth.users(id),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint support_grant_max_duration check (expires_at <= created_at + interval '24 hours')
);
create index support_grants_active_idx
  on public.support_access_grants (support_user_id, expires_at)
  where revoked_at is null;

create table public.notification_outbox (
  id bigint generated always as identity primary key,
  business_id uuid not null references public.businesses(id) on delete cascade,
  recipient_email text not null,
  template text not null,
  payload jsonb not null,
  idempotency_key text not null unique,
  attempt_count integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  sent_at timestamptz,
  failed_at timestamptz,
  created_at timestamptz not null default now()
);
create index notification_outbox_pending_idx
  on public.notification_outbox (next_attempt_at, id)
  where sent_at is null and failed_at is null;

create or replace function private.touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function private.touch_updated_at();
create trigger businesses_touch_updated_at
before update on public.businesses
for each row execute function private.touch_updated_at();
create trigger memberships_touch_updated_at
before update on public.business_memberships
for each row execute function private.touch_updated_at();
create trigger clients_touch_updated_at
before update on public.clients
for each row execute function private.touch_updated_at();
create trigger projects_touch_updated_at
before update on public.projects
for each row execute function private.touch_updated_at();
create trigger change_requests_touch_updated_at
before update on public.change_requests
for each row execute function private.touch_updated_at();
create trigger change_order_drafts_touch_updated_at
before update on public.change_order_drafts
for each row execute function private.touch_updated_at();
create trigger stripe_connections_touch_updated_at
before update on public.stripe_connections
for each row execute function private.touch_updated_at();

create or replace function private.is_active_member(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.business_memberships membership
    join public.businesses business on business.id = membership.business_id
    where membership.business_id = target_business_id
      and membership.user_id = (select auth.uid())
      and membership.status = 'active'
      and business.deleted_at is null
  );
$$;

create or replace function private.is_owner(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.business_memberships membership
    where membership.business_id = target_business_id
      and membership.user_id = (select auth.uid())
      and membership.role = 'owner'
      and membership.status = 'active'
  );
$$;

create or replace function private.has_aal2()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce((select auth.jwt() ->> 'aal') = 'aal2', false);
$$;

create or replace function private.is_session_active()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.app_sessions session
    where session.session_id = nullif((select auth.jwt() ->> 'session_id'), '')::uuid
      and session.user_id = (select auth.uid())
      and session.revoked_at is null
      and (
        session.trusted_until > now()
        or session.last_seen_at > now() - interval '30 minutes'
      )
  )
  or not exists (
    select 1
    from public.app_sessions any_session
    where any_session.session_id = nullif((select auth.jwt() ->> 'session_id'), '')::uuid
  );
$$;

create or replace function private.can_access_project(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.projects project
    join public.business_memberships membership
      on membership.business_id = project.business_id
      and membership.user_id = (select auth.uid())
      and membership.status = 'active'
    where project.id = target_project_id
      and project.deleted_at is null
      and (
        membership.role = 'owner'
        or exists (
          select 1
          from public.project_assignments assignment
          where assignment.project_id = project.id
            and assignment.membership_id = membership.id
        )
      )
  ) and (select private.is_session_active());
$$;

create or replace function private.can_access_client(target_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.clients client
    join public.business_memberships membership
      on membership.business_id = client.business_id
      and membership.user_id = (select auth.uid())
      and membership.status = 'active'
    where client.id = target_client_id
      and client.deleted_at is null
      and (
        membership.role = 'owner'
        or exists (
          select 1
          from public.projects project
          join public.project_assignments assignment on assignment.project_id = project.id
          where project.client_id = client.id
            and assignment.membership_id = membership.id
            and project.deleted_at is null
        )
      )
  ) and (select private.is_session_active());
$$;

create or replace function private.can_send_financial(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.projects project
    join public.business_memberships membership
      on membership.business_id = project.business_id
      and membership.user_id = (select auth.uid())
      and membership.status = 'active'
    where project.id = target_project_id
      and (
        membership.role = 'owner'
        or (
          membership.send_financial_documents
          and exists (
            select 1
            from public.project_assignments assignment
            where assignment.project_id = project.id
              and assignment.membership_id = membership.id
          )
        )
      )
  )
  and (select private.has_aal2())
  and (select private.is_session_active());
$$;

create or replace function private.has_support_access(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.projects project
    join public.support_access_grants access
      on access.business_id = project.business_id
      and access.support_user_id = (select auth.uid())
      and (access.project_id is null or access.project_id = project.id)
      and access.revoked_at is null
      and access.expires_at > now()
    where project.id = target_project_id
      and project.deleted_at is null
  ) and (select private.is_session_active());
$$;

revoke all on function private.is_active_member(uuid) from public;
revoke all on function private.is_owner(uuid) from public;
revoke all on function private.has_aal2() from public;
revoke all on function private.is_session_active() from public;
revoke all on function private.can_access_project(uuid) from public;
revoke all on function private.can_access_client(uuid) from public;
revoke all on function private.can_send_financial(uuid) from public;
revoke all on function private.has_support_access(uuid) from public;
grant execute on function private.is_active_member(uuid) to authenticated;
grant execute on function private.is_owner(uuid) to authenticated;
grant execute on function private.has_aal2() to authenticated;
grant execute on function private.is_session_active() to authenticated;
grant execute on function private.can_access_project(uuid) to authenticated;
grant execute on function private.can_access_client(uuid) to authenticated;
grant execute on function private.can_send_financial(uuid) to authenticated;
grant execute on function private.has_support_access(uuid) to authenticated;

create or replace function public.publish_project_scope(
  p_project_id uuid,
  p_timeline_text text,
  p_revision_limit integer,
  p_pricing_method text,
  p_hourly_rate_minor bigint,
  p_deliverables jsonb,
  p_exclusions jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  project_row public.projects%rowtype;
  next_version integer;
  scope_id uuid;
begin
  if not (select private.can_access_project(p_project_id)) then
    raise exception 'Project access denied' using errcode = 'insufficient_privilege';
  end if;
  if p_timeline_text is null or char_length(trim(p_timeline_text)) = 0
    or p_revision_limit < 0
    or p_pricing_method not in ('hourly', 'fixed')
    or (p_pricing_method = 'hourly' and (p_hourly_rate_minor is null or p_hourly_rate_minor <= 0))
    or jsonb_array_length(p_deliverables) = 0
  then
    raise exception 'A structured scope requires terms and at least one deliverable'
      using errcode = 'check_violation';
  end if;

  select * into project_row from public.projects where id = p_project_id for update;
  select coalesce(max(version), 0) + 1 into next_version
  from public.project_scopes where project_id = p_project_id;
  update public.project_scopes
  set superseded_at = now()
  where project_id = p_project_id and superseded_at is null;

  insert into public.project_scopes (
    business_id, project_id, version, timeline_text, revision_limit,
    pricing_method, hourly_rate_minor, confirmed_at, confirmed_by, created_by
  )
  values (
    project_row.business_id, project_row.id, next_version, trim(p_timeline_text),
    p_revision_limit, p_pricing_method, p_hourly_rate_minor, now(),
    (select auth.uid()), (select auth.uid())
  )
  returning id into scope_id;

  insert into public.scope_items (business_id, scope_id, kind, title, description, position)
  select
    project_row.business_id,
    scope_id,
    'deliverable',
    left(trim(item.value ->> 'title'), 240),
    coalesce(trim(item.value ->> 'description'), ''),
    item.ordinality - 1
  from jsonb_array_elements(p_deliverables) with ordinality as item(value, ordinality)
  where char_length(trim(item.value ->> 'title')) > 0;

  insert into public.scope_items (business_id, scope_id, kind, title, description, position)
  select
    project_row.business_id,
    scope_id,
    'exclusion',
    left(trim(item.value ->> 'title'), 240),
    coalesce(trim(item.value ->> 'description'), ''),
    item.ordinality - 1
  from jsonb_array_elements(p_exclusions) with ordinality as item(value, ordinality)
  where char_length(trim(item.value ->> 'title')) > 0;

  update public.projects set status = 'active', updated_at = now() where id = p_project_id;
  return scope_id;
end;
$$;

revoke all on function public.publish_project_scope(uuid, text, integer, text, bigint, jsonb, jsonb)
from public, anon;
grant execute on function public.publish_project_scope(uuid, text, integer, text, bigint, jsonb, jsonb)
to authenticated;

create or replace function public.send_change_order(
  p_project_id uuid,
  p_change_request_id uuid,
  p_title text,
  p_reason text,
  p_description text,
  p_amount_minor bigint,
  p_currency text,
  p_deposit_basis_points integer,
  p_timeline_impact text,
  p_token_digest text,
  p_token_expires_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  project_row public.projects%rowtype;
  client_row public.clients%rowtype;
  scope_row public.project_scopes%rowtype;
  draft_id uuid;
  version_id uuid;
  token_id uuid;
  next_order integer;
  snapshot_value jsonb;
  snapshot_hash text;
begin
  if not (select private.can_send_financial(p_project_id)) then
    raise exception 'Financial send permission and MFA are required'
      using errcode = 'insufficient_privilege';
  end if;
  if p_amount_minor <= 0
    or p_currency !~ '^[A-Z]{3}$'
    or p_deposit_basis_points not between 100 and 10000
    or char_length(trim(p_title)) = 0
    or char_length(trim(p_description)) = 0
    or char_length(trim(p_timeline_impact)) = 0
  then
    raise exception 'Change Order details are invalid' using errcode = 'check_violation';
  end if;

  select * into project_row from public.projects where id = p_project_id for update;
  select * into client_row from public.clients where id = project_row.client_id;
  select * into scope_row
  from public.project_scopes
  where project_id = p_project_id and superseded_at is null and confirmed_at is not null;
  if not found then
    raise exception 'Publish a structured scope before sending a Change Order'
      using errcode = 'object_not_in_prerequisite_state';
  end if;
  if client_row.primary_email is null then
    raise exception 'The client needs an approval email' using errcode = 'check_violation';
  end if;
  if p_change_request_id is not null and not exists (
    select 1 from public.change_requests
    where id = p_change_request_id and project_id = p_project_id
  ) then
    raise exception 'Change request does not belong to this project'
      using errcode = 'foreign_key_violation';
  end if;

  select coalesce(max(order_number), 0) + 1
  into next_order
  from public.change_order_versions
  where business_id = project_row.business_id;

  insert into public.change_order_drafts (
    business_id, project_id, change_request_id, title, reason, description,
    amount_minor, currency, deposit_basis_points, timeline_impact,
    evidence_warning, created_by, updated_by
  )
  values (
    project_row.business_id, project_row.id, p_change_request_id, trim(p_title),
    trim(p_reason), trim(p_description), p_amount_minor, p_currency,
    p_deposit_basis_points, trim(p_timeline_impact),
    p_change_request_id is null, (select auth.uid()), (select auth.uid())
  )
  returning id into draft_id;

  snapshot_value := jsonb_build_object(
    'title', trim(p_title),
    'reason', trim(p_reason),
    'description', trim(p_description),
    'amount_minor', p_amount_minor,
    'currency', p_currency,
    'deposit_basis_points', p_deposit_basis_points,
    'timeline_impact', trim(p_timeline_impact),
    'project_name', project_row.name,
    'project_code', project_row.code,
    'client_name', client_row.name,
    'scope_id', scope_row.id,
    'scope_version', scope_row.version
  );
  snapshot_hash := encode(extensions.digest(snapshot_value::text, 'sha256'), 'hex');

  insert into public.change_order_versions (
    business_id, project_id, draft_id, order_number, version, status, snapshot,
    content_hash, amount_minor, currency, deposit_basis_points, sent_by
  )
  values (
    project_row.business_id, project_row.id, draft_id, next_order, 1, 'sent',
    snapshot_value, snapshot_hash, p_amount_minor, p_currency,
    p_deposit_basis_points, (select auth.uid())
  )
  returning id into version_id;

  insert into public.client_access_tokens (
    business_id, change_order_version_id, token_digest, client_email, expires_at
  )
  values (
    project_row.business_id, version_id, p_token_digest,
    client_row.primary_email, p_token_expires_at
  )
  returning id into token_id;

  update public.projects set status = 'awaiting_approval', updated_at = now()
  where id = p_project_id;
  insert into public.audit_events (
    business_id, project_id, actor_user_id, action, subject_type, subject_id, metadata
  )
  values (
    project_row.business_id, project_row.id, (select auth.uid()),
    'change_order.sent', 'change_order_version', version_id::text,
    jsonb_build_object('content_hash', snapshot_hash, 'order_number', next_order, 'version', 1)
  );

  return jsonb_build_object(
    'version_id', version_id,
    'token_id', token_id,
    'order_number', next_order,
    'client_email', client_row.primary_email,
    'business_id', project_row.business_id
  );
end;
$$;

revoke all on function public.send_change_order(uuid, uuid, text, text, text, bigint, text, integer, text, text, timestamptz)
from public, anon;
grant execute on function public.send_change_order(uuid, uuid, text, text, text, bigint, text, integer, text, text, timestamptz)
to authenticated;

create or replace function public.confirm_manual_payment(
  p_payment_request_id uuid,
  p_payment_method text,
  p_reference text default null,
  p_receipt_file_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_row public.payment_requests%rowtype;
  version_row public.change_order_versions%rowtype;
  confirmation_id uuid;
  next_status public.change_order_status;
begin
  select * into request_row
  from public.payment_requests
  where id = p_payment_request_id
  for update;
  if not found or request_row.status not in ('pending', 'link_created', 'processing') then
    raise exception 'Payment request is not awaiting confirmation'
      using errcode = 'object_not_in_prerequisite_state';
  end if;
  select * into version_row
  from public.change_order_versions
  where id = request_row.change_order_version_id
  for update;
  if not (select private.can_send_financial(version_row.project_id)) then
    raise exception 'Financial permission and MFA are required'
      using errcode = 'insufficient_privilege';
  end if;
  if char_length(trim(p_payment_method)) < 2 then
    raise exception 'Payment method is required' using errcode = 'check_violation';
  end if;
  if p_receipt_file_id is not null and not exists (
    select 1 from public.project_files file
    where file.id = p_receipt_file_id
      and file.project_id = version_row.project_id
      and file.scan_status = 'clean'
      and file.deleted_at is null
  ) then
    raise exception 'Receipt must be a clean file from this project'
      using errcode = 'foreign_key_violation';
  end if;

  insert into public.manual_payment_confirmations (
    business_id, payment_request_id, amount_minor, currency, payment_method,
    reference, receipt_file_id, confirmed_by
  )
  values (
    request_row.business_id, request_row.id, request_row.amount_minor,
    request_row.currency, trim(p_payment_method), nullif(trim(p_reference), ''),
    p_receipt_file_id, (select auth.uid())
  )
  returning id into confirmation_id;

  update public.payment_requests
  set status = 'confirmed', confirmed_at = now()
  where id = request_row.id;
  next_status := case when request_row.kind = 'deposit' then 'authorized' else 'paid' end;
  update public.change_order_versions set status = next_status where id = version_row.id;
  if request_row.kind = 'deposit' then
    update public.projects set status = 'authorized', updated_at = now()
    where id = version_row.project_id;
  end if;
  insert into public.audit_events (
    business_id, project_id, actor_user_id, action, subject_type, subject_id, metadata
  )
  values (
    request_row.business_id, version_row.project_id, (select auth.uid()),
    'payment.manually_confirmed', 'payment_request', request_row.id::text,
    jsonb_build_object(
      'amount_minor', request_row.amount_minor,
      'currency', request_row.currency,
      'kind', request_row.kind,
      'payment_method', trim(p_payment_method),
      'reference', nullif(trim(p_reference), '')
    )
  );
  return confirmation_id;
end;
$$;

revoke all on function public.confirm_manual_payment(uuid, text, text, uuid)
from public, anon;
grant execute on function public.confirm_manual_payment(uuid, text, text, uuid)
to authenticated;

create or replace function public.schedule_business_deletion(p_business_id uuid)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  purge_time timestamptz := now() + interval '30 days';
begin
  if not (select private.is_owner(p_business_id)) or not (select private.has_aal2()) then
    raise exception 'Owner MFA is required' using errcode = 'insufficient_privilege';
  end if;
  update public.businesses
  set deleted_at = now(), purge_after = purge_time, updated_at = now()
  where id = p_business_id and deleted_at is null;
  if not found then
    raise exception 'Business is already scheduled for deletion'
      using errcode = 'object_not_in_prerequisite_state';
  end if;
  update public.app_sessions set revoked_at = now()
  where user_id in (
    select user_id from public.business_memberships where business_id = p_business_id
  ) and revoked_at is null;
  update public.client_access_tokens set revoked_at = now()
  where business_id = p_business_id and revoked_at is null;
  update public.business_invitations set revoked_at = now()
  where business_id = p_business_id and accepted_at is null and revoked_at is null;
  update public.support_access_grants set revoked_at = now()
  where business_id = p_business_id and revoked_at is null;
  update public.stripe_connections set disconnected_at = now(), updated_at = now()
  where business_id = p_business_id and disconnected_at is null;
  insert into public.audit_events (
    business_id, actor_user_id, action, subject_type, subject_id, metadata
  )
  values (
    p_business_id, (select auth.uid()), 'business.deletion_scheduled',
    'business', p_business_id::text, jsonb_build_object('purge_after', purge_time)
  );
  return purge_time;
end;
$$;

create or replace function public.restore_business(p_business_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.business_memberships
    where business_id = p_business_id
      and user_id = (select auth.uid())
      and role = 'owner'
      and status = 'active'
  ) then
    raise exception 'Only the owner can restore this business'
      using errcode = 'insufficient_privilege';
  end if;
  update public.businesses
  set deleted_at = null, purge_after = null, updated_at = now()
  where id = p_business_id and deleted_at is not null and purge_after > now();
  return found;
end;
$$;

revoke all on function public.schedule_business_deletion(uuid) from public, anon;
revoke all on function public.restore_business(uuid) from public, anon;
grant execute on function public.schedule_business_deletion(uuid) to authenticated;
grant execute on function public.restore_business(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.business_memberships enable row level security;
alter table public.business_invitations enable row level security;
alter table public.app_sessions enable row level security;
alter table public.recovery_codes enable row level security;
alter table public.clients enable row level security;
alter table public.projects enable row level security;
alter table public.project_assignments enable row level security;
alter table public.project_scopes enable row level security;
alter table public.scope_items enable row level security;
alter table public.project_files enable row level security;
alter table public.change_requests enable row level security;
alter table public.revision_events enable row level security;
alter table public.revision_overrides enable row level security;
alter table public.change_order_drafts enable row level security;
alter table public.change_order_versions enable row level security;
alter table public.client_access_tokens enable row level security;
alter table public.client_otp_challenges enable row level security;
alter table public.change_order_approvals enable row level security;
alter table public.stripe_connections enable row level security;
alter table public.payment_requests enable row level security;
alter table public.manual_payment_confirmations enable row level security;
alter table public.stripe_events enable row level security;
alter table public.audit_events enable row level security;
alter table public.ownership_transfers enable row level security;
alter table public.support_access_grants enable row level security;
alter table public.notification_outbox enable row level security;

create policy profiles_select_self
on public.profiles for select to authenticated
using ((select auth.uid()) = user_id);
create policy profiles_update_self
on public.profiles for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy businesses_select_member
on public.businesses for select to authenticated
using ((select private.is_active_member(id)));
create policy businesses_update_owner
on public.businesses for update to authenticated
using ((select private.is_owner(id)) and (select private.has_aal2()))
with check ((select private.is_owner(id)) and (select private.has_aal2()));

create policy memberships_select_member
on public.business_memberships for select to authenticated
using ((select private.is_active_member(business_id)));
create policy invitations_select_owner
on public.business_invitations for select to authenticated
using ((select private.is_owner(business_id)));

create policy app_sessions_select_self
on public.app_sessions for select to authenticated
using (user_id = (select auth.uid()));
create policy app_sessions_insert_self
on public.app_sessions for insert to authenticated
with check (
  user_id = (select auth.uid())
  and session_id = ((select auth.jwt() ->> 'session_id')::uuid)
);
create policy app_sessions_update_self
on public.app_sessions for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy recovery_codes_select_self
on public.recovery_codes for select to authenticated
using (user_id = (select auth.uid()) and (select private.has_aal2()));

create policy clients_select_authorized
on public.clients for select to authenticated
using ((select private.can_access_client(id)));
create policy clients_insert_owner
on public.clients for insert to authenticated
with check (
  (select private.is_owner(business_id))
  and created_by = (select auth.uid())
);
create policy clients_update_authorized
on public.clients for update to authenticated
using ((select private.can_access_client(id)))
with check ((select private.can_access_client(id)));

create policy projects_select_authorized
on public.projects for select to authenticated
using ((select private.can_access_project(id)));
create policy projects_select_support
on public.projects for select to authenticated
using ((select private.has_support_access(id)));
create policy projects_insert_owner
on public.projects for insert to authenticated
with check (
  (select private.is_owner(business_id))
  and created_by = (select auth.uid())
);
create policy projects_update_authorized
on public.projects for update to authenticated
using ((select private.can_access_project(id)))
with check ((select private.can_access_project(id)));

create policy assignments_select_authorized
on public.project_assignments for select to authenticated
using ((select private.can_access_project(project_id)));
create policy assignments_owner_all
on public.project_assignments for all to authenticated
using ((select private.is_owner(business_id)) and (select private.has_aal2()))
with check ((select private.is_owner(business_id)) and (select private.has_aal2()));

create policy scopes_select_authorized
on public.project_scopes for select to authenticated
using ((select private.can_access_project(project_id)));
create policy scopes_select_support
on public.project_scopes for select to authenticated
using ((select private.has_support_access(project_id)));
create policy scopes_insert_authorized
on public.project_scopes for insert to authenticated
with check (
  (select private.can_access_project(project_id))
  and created_by = (select auth.uid())
);
create policy scopes_update_authorized
on public.project_scopes for update to authenticated
using ((select private.can_access_project(project_id)))
with check ((select private.can_access_project(project_id)));

create policy scope_items_select_authorized
on public.scope_items for select to authenticated
using (
  exists (
    select 1 from public.project_scopes scope
    where scope.id = scope_id
      and (select private.can_access_project(scope.project_id))
  )
);
create policy scope_items_select_support
on public.scope_items for select to authenticated
using (
  exists (
    select 1 from public.project_scopes scope
    where scope.id = scope_id
      and (select private.has_support_access(scope.project_id))
  )
);
create policy scope_items_write_authorized
on public.scope_items for all to authenticated
using (
  exists (
    select 1 from public.project_scopes scope
    where scope.id = scope_id
      and (select private.can_access_project(scope.project_id))
  )
)
with check (
  exists (
    select 1 from public.project_scopes scope
    where scope.id = scope_id
      and (select private.can_access_project(scope.project_id))
  )
);

create policy project_files_select_clean
on public.project_files for select to authenticated
using (
  scan_status = 'clean'
  and (select private.can_access_project(project_id))
);
create policy project_files_select_support
on public.project_files for select to authenticated
using (
  scan_status = 'clean'
  and deleted_at is null
  and (select private.has_support_access(project_id))
);
create policy project_files_insert_authorized
on public.project_files for insert to authenticated
with check (
  scan_status = 'quarantined'
  and uploaded_by = (select auth.uid())
  and (select private.can_access_project(project_id))
);

create policy change_requests_select_authorized
on public.change_requests for select to authenticated
using ((select private.can_access_project(project_id)));
create policy change_requests_select_support
on public.change_requests for select to authenticated
using ((select private.has_support_access(project_id)));
create policy change_requests_insert_authorized
on public.change_requests for insert to authenticated
with check (
  created_by = (select auth.uid())
  and (select private.can_access_project(project_id))
);
create policy change_requests_update_authorized
on public.change_requests for update to authenticated
using ((select private.can_access_project(project_id)))
with check ((select private.can_access_project(project_id)));

create policy revision_events_select_authorized
on public.revision_events for select to authenticated
using ((select private.can_access_project(project_id)));
create policy revision_events_select_support
on public.revision_events for select to authenticated
using ((select private.has_support_access(project_id)));
create policy revision_events_insert_authorized
on public.revision_events for insert to authenticated
with check (
  created_by = (select auth.uid())
  and (select private.can_access_project(project_id))
);
create policy revision_overrides_select_authorized
on public.revision_overrides for select to authenticated
using ((select private.can_access_project(project_id)));
create policy revision_overrides_select_support
on public.revision_overrides for select to authenticated
using ((select private.has_support_access(project_id)));
create policy revision_overrides_insert_financial
on public.revision_overrides for insert to authenticated
with check (
  authorized_by = (select auth.uid())
  and (select private.can_send_financial(project_id))
);

create policy change_order_drafts_select_authorized
on public.change_order_drafts for select to authenticated
using ((select private.can_access_project(project_id)));
create policy change_order_drafts_select_support
on public.change_order_drafts for select to authenticated
using ((select private.has_support_access(project_id)));
create policy change_order_drafts_insert_authorized
on public.change_order_drafts for insert to authenticated
with check (
  created_by = (select auth.uid())
  and updated_by = (select auth.uid())
  and (select private.can_access_project(project_id))
);
create policy change_order_drafts_update_authorized
on public.change_order_drafts for update to authenticated
using ((select private.can_access_project(project_id)))
with check (
  updated_by = (select auth.uid())
  and (select private.can_access_project(project_id))
);

create policy change_order_versions_select_authorized
on public.change_order_versions for select to authenticated
using ((select private.can_access_project(project_id)));
create policy change_order_versions_select_support
on public.change_order_versions for select to authenticated
using ((select private.has_support_access(project_id)));
create policy change_order_versions_insert_financial
on public.change_order_versions for insert to authenticated
with check (
  sent_by = (select auth.uid())
  and (select private.can_send_financial(project_id))
);

create policy approvals_select_authorized
on public.change_order_approvals for select to authenticated
using (
  exists (
    select 1 from public.change_order_versions version
    where version.id = change_order_version_id
      and (select private.can_access_project(version.project_id))
  )
);

create policy stripe_connections_select_owner
on public.stripe_connections for select to authenticated
using ((select private.is_owner(business_id)));
create policy stripe_connections_owner_all
on public.stripe_connections for all to authenticated
using ((select private.is_owner(business_id)) and (select private.has_aal2()))
with check ((select private.is_owner(business_id)) and (select private.has_aal2()));

create policy payment_requests_select_authorized
on public.payment_requests for select to authenticated
using (
  exists (
    select 1 from public.change_order_versions version
    where version.id = change_order_version_id
      and (select private.can_access_project(version.project_id))
  )
);
create policy payment_requests_insert_financial
on public.payment_requests for insert to authenticated
with check (
  requested_by = (select auth.uid())
  and exists (
    select 1 from public.change_order_versions version
    where version.id = change_order_version_id
      and (select private.can_send_financial(version.project_id))
  )
);

create policy manual_payments_select_authorized
on public.manual_payment_confirmations for select to authenticated
using (
  exists (
    select 1
    from public.payment_requests request
    join public.change_order_versions version on version.id = request.change_order_version_id
    where request.id = payment_request_id
      and (select private.can_access_project(version.project_id))
  )
);
create policy manual_payments_insert_financial
on public.manual_payment_confirmations for insert to authenticated
with check (
  confirmed_by = (select auth.uid())
  and exists (
    select 1
    from public.payment_requests request
    join public.change_order_versions version on version.id = request.change_order_version_id
    where request.id = payment_request_id
      and (select private.can_send_financial(version.project_id))
  )
);

create policy audit_events_select_authorized
on public.audit_events for select to authenticated
using (
  case
    when project_id is null then (select private.is_owner(business_id))
    else (select private.can_access_project(project_id))
  end
);

create policy ownership_transfers_select_owner_parties
on public.ownership_transfers for select to authenticated
using (
  (select private.is_owner(business_id))
  or to_user_id = (select auth.uid())
);
create policy support_grants_select_owner
on public.support_access_grants for select to authenticated
using ((select private.is_owner(business_id)));

grant select, insert, update, delete
on public.profiles,
   public.businesses,
   public.business_memberships,
   public.business_invitations,
   public.app_sessions,
   public.recovery_codes,
   public.clients,
   public.projects,
   public.project_assignments,
   public.project_scopes,
   public.scope_items,
   public.project_files,
   public.change_requests,
   public.revision_events,
   public.revision_overrides,
   public.change_order_drafts,
   public.change_order_versions,
   public.client_access_tokens,
   public.client_otp_challenges,
   public.change_order_approvals,
   public.stripe_connections,
   public.payment_requests,
   public.manual_payment_confirmations,
   public.audit_events,
   public.ownership_transfers,
   public.support_access_grants
to authenticated;

revoke update, delete on public.change_order_versions from authenticated;
revoke update, delete on public.change_order_approvals from authenticated;
revoke insert, update, delete on public.audit_events from authenticated;
revoke all on public.stripe_events from anon, authenticated;
revoke all on public.notification_outbox from anon, authenticated;
revoke all on public.client_access_tokens from anon, authenticated;
revoke all on public.client_otp_challenges from anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'quarantine',
    'quarantine',
    false,
    20971520,
    array[
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/png',
      'image/jpeg',
      'image/webp',
      'text/plain'
    ]
  ),
  (
    'clean-project-files',
    'clean-project-files',
    false,
    20971520,
    array[
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/png',
      'image/jpeg',
      'image/webp',
      'text/plain'
    ]
  )
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy storage_quarantine_insert
on storage.objects for insert to authenticated
with check (
  bucket_id = 'quarantine'
  and (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
  and (storage.foldername(name))[2] ~ '^[0-9a-f-]{36}$'
  and (select private.can_access_project(((storage.foldername(name))[2])::uuid))
);

create policy storage_clean_select
on storage.objects for select to authenticated
using (
  bucket_id = 'clean-project-files'
  and (storage.foldername(name))[2] ~ '^[0-9a-f-]{36}$'
  and (select private.can_access_project(((storage.foldername(name))[2])::uuid))
);
