create table public.social_post_media (
    id uuid primary key default gen_random_uuid(),
    post_id uuid not null references public.social_posts(id) on delete cascade,
    storage_path text not null,
    media_type text not null check(media_type in ('image','video')),
    position smallint not null check(position between 0 and 9),
    created_at timestamptz not null default now(),
    unique(post_id,position)
);

create index social_post_media_post_idx on public.social_post_media(post_id,position);
alter table public.social_post_media enable row level security;
create policy "Published post media is public" on public.social_post_media for select
using(exists(select 1 from public.social_posts where id=post_id and is_published));
create policy "Authors add post media" on public.social_post_media for insert to authenticated
with check(exists(select 1 from public.social_posts where id=post_id and author_id=(select auth.uid())));
create policy "Authors delete post media" on public.social_post_media for delete to authenticated
using(exists(select 1 from public.social_posts where id=post_id and author_id=(select auth.uid())));
grant select on public.social_post_media to anon,authenticated;
grant insert,delete on public.social_post_media to authenticated;

comment on table public.social_post_media is 'Ordered media attachments for social post galleries. Legacy single attachments remain on social_posts.';
