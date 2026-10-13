-- Registration and credential uploads can contain identity documents.
-- Disable public object access and restrict reads to authenticated administrators.
update storage.buckets
set public = false
where id = 'registration-documents';

drop policy if exists registration_documents_select on storage.objects;
drop policy if exists registration_documents_insert on storage.objects;

create policy registration_documents_admin_select
on storage.objects for select to authenticated
using (
  bucket_id = 'registration-documents'
  and exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid()
      and p.role in ('admin','super_admin')
  )
);

create policy registration_documents_authenticated_insert
on storage.objects for insert to authenticated
with check (
  bucket_id = 'registration-documents'
  and (storage.foldername(name))[1] in ('engineers','profiles','firms','contractors','suppliers')
);

revoke update (updated_date) on table public.design_purchase from authenticated;
