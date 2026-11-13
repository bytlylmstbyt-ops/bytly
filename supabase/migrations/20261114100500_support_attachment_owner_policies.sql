-- Allow authenticated users to upload and read only their own support attachments.
drop policy if exists support_attachments_owner_insert on storage.objects;
drop policy if exists support_attachments_owner_select on storage.objects;
drop policy if exists support_attachments_owner_delete on storage.objects;

create policy support_attachments_owner_insert
on storage.objects for insert to authenticated
with check (
  bucket_id = 'project-files'
  and (storage.foldername(name))[1] = 'support'
  and (storage.foldername(name))[2] = auth.uid()::text
);

create policy support_attachments_owner_select
on storage.objects for select to authenticated
using (
  bucket_id = 'project-files'
  and (storage.foldername(name))[1] = 'support'
  and (
    (storage.foldername(name))[2] = auth.uid()::text
    or exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid() and p.role in ('admin','super_admin')
    )
  )
);

create policy support_attachments_owner_delete
on storage.objects for delete to authenticated
using (
  bucket_id = 'project-files'
  and (storage.foldername(name))[1] = 'support'
  and (
    (storage.foldername(name))[2] = auth.uid()::text
    or exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid() and p.role in ('admin','super_admin')
    )
  )
);
