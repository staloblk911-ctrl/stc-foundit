-- STC FoundIt — storage policies for the report-images bucket.
-- The bucket is made private by migration 0007; storage.objects still has
-- its own RLS and needs explicit policies.

create policy "authenticated users can upload report images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'report-images');

create policy "anyone can view report images"
  on storage.objects for select
  to public
  using (bucket_id = 'report-images');
