drop policy if exists "Studio admins can read stick paths" on public.stick_paths;

create policy "Stick paths are publicly readable"
    on public.stick_paths for select
    to anon, authenticated
    using (true);

grant select on public.stick_paths to anon, authenticated;
