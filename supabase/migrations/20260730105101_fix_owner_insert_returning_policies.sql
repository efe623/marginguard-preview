-- INSERT ... RETURNING is also checked by SELECT policies. The ID-based
-- helpers re-query the target table and cannot see a row created by the same
-- statement, so authorize an active owner directly from the new row's tenant.
drop policy if exists clients_select_authorized on public.clients;
create policy clients_select_authorized
on public.clients for select to authenticated
using (
  (
    (select private.is_owner(business_id))
    and (select private.is_session_active())
  )
  or (select private.can_access_client(id))
);

drop policy if exists projects_select_authorized on public.projects;
create policy projects_select_authorized
on public.projects for select to authenticated
using (
  (
    (select private.is_owner(business_id))
    and (select private.is_session_active())
  )
  or (select private.can_access_project(id))
);
