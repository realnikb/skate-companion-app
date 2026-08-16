create table public.spot_media (
    id uuid primary key default gen_random_uuid(), spot_id uuid not null references public.map_spots(id) on delete cascade,
    created_by uuid references auth.users(id) on delete set null, storage_path text not null unique,
    media_type text not null check(media_type in ('image','video')), caption text,
    is_cover boolean not null default false, is_published boolean not null default false,
    created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.spot_comments (
    id uuid primary key default gen_random_uuid(), spot_id uuid not null references public.map_spots(id) on delete cascade,
    user_id uuid references auth.users(id) on delete set null, body text not null check(char_length(body) between 1 and 2000),
    is_published boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.spot_media enable row level security; alter table public.spot_comments enable row level security;
create policy "Published spot media is public" on public.spot_media for select using(is_published or public.is_studio_admin());
create policy "Players submit spot media" on public.spot_media for insert to authenticated with check(created_by=(select auth.uid()) and not is_published and exists(select 1 from public.map_spots where id=spot_id and is_published));
create policy "Published comments are public" on public.spot_comments for select using(is_published or public.is_studio_admin());
create policy "Players comment on published spots" on public.spot_comments for insert to authenticated with check(user_id=(select auth.uid()) and is_published and exists(select 1 from public.map_spots where id=spot_id and is_published));
create policy "Players edit their comments" on public.spot_comments for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy "Players delete their comments" on public.spot_comments for delete to authenticated using(user_id=(select auth.uid()));
create policy "Studio manages spot media" on public.spot_media for all to authenticated using(public.is_studio_admin()) with check(public.is_studio_admin());
create policy "Studio manages comments" on public.spot_comments for all to authenticated using(public.is_studio_admin()) with check(public.is_studio_admin());
grant select on public.spot_media,public.spot_comments to anon,authenticated; grant insert on public.spot_media,public.spot_comments to authenticated; grant update,delete on public.spot_media,public.spot_comments to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('spot-media','spot-media',true,52428800,array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm']) on conflict(id) do update set public=true,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy "Public reads published spot media files" on storage.objects for select using(bucket_id='spot-media' and exists(select 1 from public.spot_media where storage_path=name and is_published));
create policy "Players upload spot media files" on storage.objects for insert to authenticated with check(bucket_id='spot-media' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "Players delete unpublished uploads" on storage.objects for delete to authenticated using(bucket_id='spot-media' and owner_id=(select auth.uid()::text));
create policy "Studio manages spot media files" on storage.objects for all to authenticated using(bucket_id='spot-media' and public.is_studio_admin()) with check(bucket_id='spot-media' and public.is_studio_admin());
