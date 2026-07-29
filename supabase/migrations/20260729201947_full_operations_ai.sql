alter table public.businesses
  add column if not exists business_type text,
  add column if not exists default_hourly_rate_minor bigint
    check (default_hourly_rate_minor is null or default_hourly_rate_minor > 0),
  add column if not exists ai_enabled boolean not null default false,
  add column if not exists ai_terms_acknowledged_at timestamptz;

alter table public.clients
  add column if not exists contact_name text,
  add column if not exists billing_address text;

alter table public.projects
  add column if not exists description text,
  add column if not exists start_date date,
  add column if not exists due_date date,
  add column if not exists ai_opt_out boolean not null default false,
  add constraint projects_date_order
    check (start_date is null or due_date is null or due_date >= start_date);

alter table public.project_files
  add column if not exists kind text not null default 'other'
    check (kind in ('quote', 'contract', 'receipt', 'message', 'other'));

create table public.quote_templates (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 160),
  title text not null check (char_length(title) between 1 and 240),
  introduction text not null default '',
  terms text not null default '',
  default_valid_days integer not null default 14 check (default_valid_days between 1 and 365),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, id),
  unique (business_id, name)
);

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  project_id uuid not null,
  template_id uuid references public.quote_templates(id) on delete set null,
  quote_number text not null,
  title text not null check (char_length(title) between 1 and 240),
  introduction text not null default '',
  terms text not null default '',
  amount_minor bigint not null check (amount_minor >= 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  valid_until date,
  status text not null default 'draft'
    check (status in ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  snapshot jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users(id),
  sent_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, id),
  unique (business_id, quote_number),
  foreign key (business_id, project_id)
    references public.projects (business_id, id) on delete cascade
);
create index quotes_project_idx on public.quotes (project_id, created_at desc);

create table public.client_messages (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  project_id uuid not null,
  source_type text not null
    check (source_type in ('whatsapp', 'email', 'meeting_note', 'other')),
  sender_name text,
  sender_address text,
  content text not null check (char_length(content) between 1 and 100000),
  occurred_at timestamptz,
  imported_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique (business_id, id),
  foreign key (business_id, project_id)
    references public.projects (business_id, id) on delete cascade
);
create index client_messages_project_idx
  on public.client_messages (project_id, coalesce(occurred_at, created_at) desc);

create table public.project_tasks (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  project_id uuid not null,
  title text not null check (char_length(title) between 1 and 240),
  description text not null default '',
  status text not null default 'todo'
    check (status in ('todo', 'in_progress', 'blocked', 'done')),
  priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high', 'urgent')),
  assigned_to uuid references auth.users(id) on delete set null,
  due_at timestamptz,
  completed_at timestamptz,
  position integer not null default 0 check (position >= 0),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, id),
  foreign key (business_id, project_id)
    references public.projects (business_id, id) on delete cascade
);
create index project_tasks_board_idx
  on public.project_tasks (project_id, status, position, due_at);

create table public.time_entries (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  project_id uuid not null,
  task_id uuid references public.project_tasks(id) on delete set null,
  user_id uuid not null references auth.users(id),
  minutes integer not null check (minutes between 1 and 1440),
  work_date date not null default current_date,
  description text not null default '',
  billable boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, id),
  foreign key (business_id, project_id)
    references public.projects (business_id, id) on delete cascade
);
create index time_entries_project_date_idx
  on public.time_entries (project_id, work_date desc);

create table public.project_expenses (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  project_id uuid not null,
  category text not null
    check (category in ('material', 'subcontractor', 'travel', 'software', 'other')),
  vendor text,
  description text not null,
  amount_minor bigint not null check (amount_minor > 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  incurred_on date not null default current_date,
  receipt_file_id uuid references public.project_files(id) on delete set null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, id),
  foreign key (business_id, project_id)
    references public.projects (business_id, id) on delete cascade
);
create index project_expenses_project_date_idx
  on public.project_expenses (project_id, incurred_on desc);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  project_id uuid not null,
  client_id uuid not null,
  invoice_number text not null,
  description text not null default '',
  amount_minor bigint not null check (amount_minor > 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  issue_date date not null default current_date,
  due_date date not null,
  status text not null default 'draft'
    check (status in ('draft', 'sent', 'partially_paid', 'paid', 'overdue', 'void')),
  paid_amount_minor bigint not null default 0
    check (paid_amount_minor >= 0 and paid_amount_minor <= amount_minor),
  external_payment_url text,
  sent_at timestamptz,
  paid_at timestamptz,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, id),
  unique (business_id, invoice_number),
  foreign key (business_id, project_id)
    references public.projects (business_id, id) on delete cascade,
  foreign key (business_id, client_id)
    references public.clients (business_id, id) on delete restrict,
  constraint invoice_date_order check (due_date >= issue_date)
);
create index invoices_business_status_due_idx
  on public.invoices (business_id, status, due_date);
create index invoices_project_idx on public.invoices (project_id, created_at desc);

create table public.ai_generations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  project_id uuid not null,
  generation_type text not null
    check (generation_type in (
      'scope_extraction',
      'request_detection',
      'scope_creep',
      'extra_work_estimate',
      'change_order',
      'payment_follow_up'
    )),
  source_type text not null,
  source_ids uuid[] not null default '{}',
  input_hash text not null,
  model text not null,
  output jsonb not null,
  status text not null default 'draft'
    check (status in ('draft', 'accepted', 'dismissed')),
  input_tokens integer,
  output_tokens integer,
  consent_confirmed boolean not null,
  created_by uuid not null references auth.users(id),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (business_id, id),
  foreign key (business_id, project_id)
    references public.projects (business_id, id) on delete cascade
);
create index ai_generations_project_idx
  on public.ai_generations (project_id, generation_type, created_at desc);
create index ai_generations_business_day_idx
  on public.ai_generations (business_id, created_at desc);

create table public.project_updates (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  project_id uuid not null,
  title text not null check (char_length(title) between 1 and 240),
  body text not null,
  visible_to_client boolean not null default false,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique (business_id, id),
  foreign key (business_id, project_id)
    references public.projects (business_id, id) on delete cascade
);
create index project_updates_project_idx
  on public.project_updates (project_id, created_at desc);

create table public.client_portal_tokens (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  client_id uuid not null,
  token_digest text not null unique,
  label text not null default 'Client portal',
  expires_at timestamptz not null,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  foreign key (business_id, client_id)
    references public.clients (business_id, id) on delete cascade,
  constraint client_portal_token_expiry check (expires_at > created_at)
);
create index client_portal_tokens_client_idx
  on public.client_portal_tokens (client_id, created_at desc);

create table public.in_app_notifications (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  kind text not null,
  title text not null,
  body text not null default '',
  href text,
  dedupe_key text unique,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index in_app_notifications_user_idx
  on public.in_app_notifications (user_id, read_at, created_at desc);

create trigger quote_templates_touch_updated_at
before update on public.quote_templates
for each row execute function private.touch_updated_at();
create trigger quotes_touch_updated_at
before update on public.quotes
for each row execute function private.touch_updated_at();
create trigger project_tasks_touch_updated_at
before update on public.project_tasks
for each row execute function private.touch_updated_at();
create trigger time_entries_touch_updated_at
before update on public.time_entries
for each row execute function private.touch_updated_at();
create trigger project_expenses_touch_updated_at
before update on public.project_expenses
for each row execute function private.touch_updated_at();
create trigger invoices_touch_updated_at
before update on public.invoices
for each row execute function private.touch_updated_at();

alter table public.quote_templates enable row level security;
alter table public.quotes enable row level security;
alter table public.client_messages enable row level security;
alter table public.project_tasks enable row level security;
alter table public.time_entries enable row level security;
alter table public.project_expenses enable row level security;
alter table public.invoices enable row level security;
alter table public.ai_generations enable row level security;
alter table public.project_updates enable row level security;
alter table public.client_portal_tokens enable row level security;
alter table public.in_app_notifications enable row level security;

create policy quote_templates_select_member
on public.quote_templates for select to authenticated
using ((select private.is_active_member(business_id)));
create policy quote_templates_owner_all
on public.quote_templates for all to authenticated
using ((select private.is_owner(business_id)))
with check ((select private.is_owner(business_id)) and created_by = (select auth.uid()));

create policy quotes_select_project
on public.quotes for select to authenticated
using ((select private.can_access_project(project_id)));
create policy quotes_insert_financial
on public.quotes for insert to authenticated
with check (
  (select private.can_send_financial(project_id))
  and created_by = (select auth.uid())
);
create policy quotes_update_financial
on public.quotes for update to authenticated
using ((select private.can_send_financial(project_id)))
with check ((select private.can_send_financial(project_id)));

create policy client_messages_project_all
on public.client_messages for all to authenticated
using ((select private.can_access_project(project_id)))
with check (
  (select private.can_access_project(project_id))
  and imported_by = (select auth.uid())
);

create policy project_tasks_project_all
on public.project_tasks for all to authenticated
using ((select private.can_access_project(project_id)))
with check (
  (select private.can_access_project(project_id))
  and created_by = (select auth.uid())
);

create policy time_entries_project_select
on public.time_entries for select to authenticated
using ((select private.can_access_project(project_id)));
create policy time_entries_project_insert
on public.time_entries for insert to authenticated
with check (
  (select private.can_access_project(project_id))
  and user_id = (select auth.uid())
);
create policy time_entries_project_update
on public.time_entries for update to authenticated
using (
  (select private.can_access_project(project_id))
  and (user_id = (select auth.uid()) or (select private.is_owner(business_id)))
)
with check ((select private.can_access_project(project_id)));
create policy time_entries_project_delete
on public.time_entries for delete to authenticated
using (
  (select private.can_access_project(project_id))
  and (user_id = (select auth.uid()) or (select private.is_owner(business_id)))
);

create policy project_expenses_project_select
on public.project_expenses for select to authenticated
using ((select private.can_access_project(project_id)));
create policy project_expenses_project_all
on public.project_expenses for all to authenticated
using ((select private.can_send_financial(project_id)))
with check (
  (select private.can_send_financial(project_id))
  and created_by = (select auth.uid())
);

create policy invoices_project_select
on public.invoices for select to authenticated
using ((select private.can_access_project(project_id)));
create policy invoices_project_all
on public.invoices for all to authenticated
using ((select private.can_send_financial(project_id)))
with check (
  (select private.can_send_financial(project_id))
  and created_by = (select auth.uid())
);

create policy ai_generations_project_select
on public.ai_generations for select to authenticated
using ((select private.can_access_project(project_id)));
create policy ai_generations_project_insert
on public.ai_generations for insert to authenticated
with check (
  (select private.can_access_project(project_id))
  and created_by = (select auth.uid())
  and consent_confirmed = true
);
create policy ai_generations_project_update
on public.ai_generations for update to authenticated
using ((select private.can_access_project(project_id)))
with check ((select private.can_access_project(project_id)));

create policy project_updates_project_all
on public.project_updates for all to authenticated
using ((select private.can_access_project(project_id)))
with check (
  (select private.can_access_project(project_id))
  and created_by = (select auth.uid())
);

create policy client_portal_tokens_owner_all
on public.client_portal_tokens for all to authenticated
using ((select private.is_owner(business_id)))
with check (
  (select private.is_owner(business_id))
  and created_by = (select auth.uid())
);

create policy in_app_notifications_recipient_select
on public.in_app_notifications for select to authenticated
using (
  user_id = (select auth.uid())
  and (select private.is_active_member(business_id))
);
create policy in_app_notifications_recipient_update
on public.in_app_notifications for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

grant select, insert, update, delete on public.quote_templates to authenticated;
grant select, insert, update, delete on public.quotes to authenticated;
grant select, insert, update, delete on public.client_messages to authenticated;
grant select, insert, update, delete on public.project_tasks to authenticated;
grant select, insert, update, delete on public.time_entries to authenticated;
grant select, insert, update, delete on public.project_expenses to authenticated;
grant select, insert, update, delete on public.invoices to authenticated;
grant select, insert, update on public.ai_generations to authenticated;
grant select, insert, update, delete on public.project_updates to authenticated;
grant select, insert, update, delete on public.client_portal_tokens to authenticated;
grant select, update on public.in_app_notifications to authenticated;
