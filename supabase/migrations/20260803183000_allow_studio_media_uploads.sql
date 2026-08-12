create policy "Studio administrators can upload trick media"
    on storage.objects for insert to authenticated
    with check (
        bucket_id = 'trick-media'
        and (select public.is_studio_admin())
    );

create policy "Studio administrators can update trick media"
    on storage.objects for update to authenticated
    using (
        bucket_id = 'trick-media'
        and (select public.is_studio_admin())
    )
    with check (
        bucket_id = 'trick-media'
        and (select public.is_studio_admin())
    );

create policy "Studio administrators can delete trick media"
    on storage.objects for delete to authenticated
    using (
        bucket_id = 'trick-media'
        and (select public.is_studio_admin())
    );
