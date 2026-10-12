-- Allow authenticated permit owners to upload and read their own permit files.
-- Permit paths use: permits/{auth.uid()}/{randomized-filename}
create policy permit_files_storage_insert
on storage.objects for insert to authenticated
with check (
  bucket_id = 'project-files'
  and (storage.foldername(name))[1] = 'permits'
  and (storage.foldername(name))[2] = auth.uid()::text
);

create policy permit_files_storage_select
on storage.objects for select to authenticated
using (
  bucket_id = 'project-files'
  and (storage.foldername(name))[1] = 'permits'
  and (storage.foldername(name))[2] = auth.uid()::text
);

create policy permit_files_storage_delete
on storage.objects for delete to authenticated
using (
  bucket_id = 'project-files'
  and (storage.foldername(name))[1] = 'permits'
  and (storage.foldername(name))[2] = auth.uid()::text
);
