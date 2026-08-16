create table public.social_posts (
    id uuid primary key default gen_random_uuid(), author_id uuid not null references public.profiles(id) on delete cascade,
    crew_id uuid references public.crews(id) on delete cascade,
    body text not null check(char_length(body) between 1 and 2000),
    post_type text not null default 'post' check(post_type in ('post','session','spot','video')),
    image_path text, external_video_url text check(external_video_url is null or external_video_url ~ '^https://'),
    location text check(char_length(location) <= 120), session_at timestamptz,
    likes_count integer not null default 0 check(likes_count >= 0), comments_count integer not null default 0 check(comments_count >= 0),
    is_published boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index social_posts_feed_idx on public.social_posts(created_at desc) where is_published;
create index social_posts_crew_idx on public.social_posts(crew_id,created_at desc) where is_published;
create trigger set_social_posts_updated_at before update on public.social_posts for each row execute function public.set_updated_at();
alter table public.social_posts enable row level security;
create policy "Published social posts are public" on public.social_posts for select using(is_published);
create policy "Players create posts" on public.social_posts for insert to authenticated with check(author_id=(select auth.uid()) and (crew_id is null or public.is_crew_staff(crew_id)));
create policy "Authors update posts" on public.social_posts for update to authenticated using(author_id=(select auth.uid())) with check(author_id=(select auth.uid()) and (crew_id is null or public.is_crew_staff(crew_id)));
create policy "Authors delete posts" on public.social_posts for delete to authenticated using(author_id=(select auth.uid()));
grant select on public.social_posts to anon,authenticated; grant insert,update,delete on public.social_posts to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('social-media','social-media',true,10485760,array['image/jpeg','image/png','image/webp','image/gif']) on conflict(id) do update set public=true,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy "Social images are public" on storage.objects for select using(bucket_id='social-media');
create policy "Players upload social images" on storage.objects for insert to authenticated with check(bucket_id='social-media' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "Players delete their social images" on storage.objects for delete to authenticated using(bucket_id='social-media' and owner_id=(select auth.uid()::text));
