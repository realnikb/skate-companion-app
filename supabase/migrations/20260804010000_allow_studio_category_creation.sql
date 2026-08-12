create policy "Studio administrators can create categories"
    on public.trick_categories for insert to authenticated
    with check ((select public.is_studio_admin()));

grant insert on public.trick_categories to authenticated;
