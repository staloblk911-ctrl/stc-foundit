-- Keep report photos behind the same sign-in gate as report listings.
update storage.buckets
set public = false
where id = 'report-images';

drop policy if exists "anyone can view report images" on storage.objects;

create policy "signed in users can view report images"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'report-images');
