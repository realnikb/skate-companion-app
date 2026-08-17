create policy "Studio administrators can read every crew"
    on public.crews for select to authenticated
    using ((select public.is_studio_admin()));
create policy "Studio administrators can create crews"
    on public.crews for insert to authenticated
    with check ((select public.is_studio_admin()));
create policy "Studio administrators can update crews"
    on public.crews for update to authenticated
    using ((select public.is_studio_admin()))
    with check ((select public.is_studio_admin()));
create policy "Studio administrators can delete crews"
    on public.crews for delete to authenticated
    using ((select public.is_studio_admin()));

create policy "Studio administrators can manage crew rosters"
    on public.crew_members for all to authenticated
    using ((select public.is_studio_admin()))
    with check ((select public.is_studio_admin()));
create policy "Studio administrators can read crew links"
    on public.crew_links for select to authenticated
    using ((select public.is_studio_admin()));
create policy "Studio administrators can manage crew links"
    on public.crew_links for all to authenticated
    using ((select public.is_studio_admin()))
    with check ((select public.is_studio_admin()));
create policy "Studio administrators can read crew videos"
    on public.crew_videos for select to authenticated
    using ((select public.is_studio_admin()));
create policy "Studio administrators can manage crew videos"
    on public.crew_videos for all to authenticated
    using ((select public.is_studio_admin()))
    with check ((select public.is_studio_admin()));

create policy "Studio administrators upload crew media"
    on storage.objects for insert to authenticated
    with check (bucket_id = 'crew-media' and (select public.is_studio_admin()));
create policy "Studio administrators update crew media"
    on storage.objects for update to authenticated
    using (bucket_id = 'crew-media' and (select public.is_studio_admin()));
create policy "Studio administrators delete crew media"
    on storage.objects for delete to authenticated
    using (bucket_id = 'crew-media' and (select public.is_studio_admin()));

