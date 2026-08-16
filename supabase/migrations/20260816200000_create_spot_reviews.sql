create table public.spot_reviews (
    id uuid primary key default gen_random_uuid(),
    spot_id uuid not null references public.map_spots(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    rating smallint not null check (rating between 1 and 5),
    body text check (body is null or char_length(body) between 1 and 2000),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (spot_id, user_id)
);

alter table public.spot_reviews enable row level security;
create policy "Published spot reviews are public" on public.spot_reviews for select
using (exists(select 1 from public.map_spots where id=spot_id and is_published));
create policy "Players can review published spots" on public.spot_reviews for insert to authenticated
with check (user_id=(select auth.uid()) and exists(select 1 from public.map_spots where id=spot_id and is_published));
create policy "Players can edit their reviews" on public.spot_reviews for update to authenticated
using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
create policy "Players can remove their reviews" on public.spot_reviews for delete to authenticated
using (user_id=(select auth.uid()));
create policy "Studio manages reviews" on public.spot_reviews for all to authenticated
using (public.is_studio_admin()) with check (public.is_studio_admin());
grant select on public.spot_reviews to anon, authenticated;
grant insert, update, delete on public.spot_reviews to authenticated;
