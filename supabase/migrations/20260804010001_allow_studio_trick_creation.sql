create policy "Studio administrators can create tricks"
    on public.tricks for insert to authenticated
    with check ((select public.is_studio_admin()));

grant insert on public.tricks to authenticated;
