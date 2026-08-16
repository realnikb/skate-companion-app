create policy "Players can submit community spots"
on public.map_spots for insert to authenticated
with check (
    created_by = (select auth.uid())
    and category = 'community'
    and is_published = false
    and exists (select 1 from public.skate_maps where id = map_id and is_published)
);
create policy "Players can update their unpublished spots"
on public.map_spots for update to authenticated
using (created_by = (select auth.uid()) and not is_published)
with check (created_by = (select auth.uid()) and category = 'community' and not is_published);
