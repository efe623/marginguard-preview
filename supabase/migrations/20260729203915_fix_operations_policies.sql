-- Split broad ALL policies so edits are not tied to the row's original creator.
-- Authorization remains tenant- and project-scoped through the private helpers.

drop policy if exists quote_templates_owner_all on public.quote_templates;
create policy quote_templates_owner_insert
on public.quote_templates for insert to authenticated
with check (
  (select private.is_owner(business_id))
  and created_by = (select auth.uid())
);
create policy quote_templates_owner_update
on public.quote_templates for update to authenticated
using ((select private.is_owner(business_id)))
with check ((select private.is_owner(business_id)));
create policy quote_templates_owner_delete
on public.quote_templates for delete to authenticated
using ((select private.is_owner(business_id)));

drop policy if exists client_messages_project_all on public.client_messages;
create policy client_messages_project_select
on public.client_messages for select to authenticated
using ((select private.can_access_project(project_id)));
create policy client_messages_project_insert
on public.client_messages for insert to authenticated
with check (
  (select private.can_access_project(project_id))
  and imported_by = (select auth.uid())
);
create policy client_messages_project_delete
on public.client_messages for delete to authenticated
using (
  (select private.can_access_project(project_id))
  and (
    imported_by = (select auth.uid())
    or (select private.is_owner(business_id))
  )
);
revoke update on public.client_messages from authenticated;

drop policy if exists project_tasks_project_all on public.project_tasks;
create policy project_tasks_project_select
on public.project_tasks for select to authenticated
using ((select private.can_access_project(project_id)));
create policy project_tasks_project_insert
on public.project_tasks for insert to authenticated
with check (
  (select private.can_access_project(project_id))
  and created_by = (select auth.uid())
);
create policy project_tasks_project_update
on public.project_tasks for update to authenticated
using ((select private.can_access_project(project_id)))
with check ((select private.can_access_project(project_id)));
create policy project_tasks_project_delete
on public.project_tasks for delete to authenticated
using (
  (select private.can_access_project(project_id))
  and (
    created_by = (select auth.uid())
    or (select private.is_owner(business_id))
  )
);

drop policy if exists project_expenses_project_all on public.project_expenses;
create policy project_expenses_project_insert
on public.project_expenses for insert to authenticated
with check (
  (select private.can_send_financial(project_id))
  and created_by = (select auth.uid())
);
create policy project_expenses_project_update
on public.project_expenses for update to authenticated
using ((select private.can_send_financial(project_id)))
with check ((select private.can_send_financial(project_id)));
create policy project_expenses_project_delete
on public.project_expenses for delete to authenticated
using ((select private.can_send_financial(project_id)));

drop policy if exists invoices_project_all on public.invoices;
create policy invoices_project_insert
on public.invoices for insert to authenticated
with check (
  (select private.can_send_financial(project_id))
  and created_by = (select auth.uid())
);
create policy invoices_project_update
on public.invoices for update to authenticated
using ((select private.can_send_financial(project_id)))
with check ((select private.can_send_financial(project_id)));
create policy invoices_project_delete
on public.invoices for delete to authenticated
using ((select private.can_send_financial(project_id)));

drop policy if exists project_updates_project_all on public.project_updates;
create policy project_updates_project_select
on public.project_updates for select to authenticated
using ((select private.can_access_project(project_id)));
create policy project_updates_project_insert
on public.project_updates for insert to authenticated
with check (
  (select private.can_access_project(project_id))
  and created_by = (select auth.uid())
);
create policy project_updates_project_update
on public.project_updates for update to authenticated
using (
  (select private.can_access_project(project_id))
  and (
    created_by = (select auth.uid())
    or (select private.is_owner(business_id))
  )
)
with check ((select private.can_access_project(project_id)));
create policy project_updates_project_delete
on public.project_updates for delete to authenticated
using (
  (select private.can_access_project(project_id))
  and (
    created_by = (select auth.uid())
    or (select private.is_owner(business_id))
  )
);

drop policy if exists client_portal_tokens_owner_all on public.client_portal_tokens;
create policy client_portal_tokens_owner_insert
on public.client_portal_tokens for insert to authenticated
with check (
  (select private.is_owner(business_id))
  and created_by = (select auth.uid())
);
create policy client_portal_tokens_owner_update
on public.client_portal_tokens for update to authenticated
using ((select private.is_owner(business_id)))
with check ((select private.is_owner(business_id)));
create policy client_portal_tokens_owner_delete
on public.client_portal_tokens for delete to authenticated
using ((select private.is_owner(business_id)));

-- Foreign-key and common filtering indexes used by RLS and project views.
create index if not exists quote_templates_business_idx
  on public.quote_templates (business_id, updated_at desc);
create index if not exists quotes_template_idx
  on public.quotes (template_id) where template_id is not null;
create index if not exists project_tasks_assigned_idx
  on public.project_tasks (assigned_to, status) where assigned_to is not null;
create index if not exists time_entries_task_idx
  on public.time_entries (task_id) where task_id is not null;
create index if not exists time_entries_user_idx
  on public.time_entries (user_id, work_date desc);
create index if not exists project_expenses_receipt_idx
  on public.project_expenses (receipt_file_id) where receipt_file_id is not null;
