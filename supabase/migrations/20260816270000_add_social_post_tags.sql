create table public.social_post_user_tags (
    post_id uuid not null references public.social_posts(id) on delete cascade,
    user_id uuid not null references public.profiles(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key(post_id,user_id)
);

create table public.social_post_crew_tags (
    post_id uuid not null references public.social_posts(id) on delete cascade,
    crew_id uuid not null references public.crews(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key(post_id,crew_id)
);

create index social_post_user_tags_user_idx on public.social_post_user_tags(user_id,created_at desc);
create index social_post_crew_tags_crew_idx on public.social_post_crew_tags(crew_id,created_at desc);

alter table public.social_post_user_tags enable row level security;
alter table public.social_post_crew_tags enable row level security;

create policy "Published post skater tags are public" on public.social_post_user_tags for select using(exists(select 1 from public.social_posts where id=post_id and is_published));
create policy "Authors tag skaters" on public.social_post_user_tags for insert to authenticated with check(exists(select 1 from public.social_posts where id=post_id and author_id=(select auth.uid())));
create policy "Authors remove skater tags" on public.social_post_user_tags for delete to authenticated using(exists(select 1 from public.social_posts where id=post_id and author_id=(select auth.uid())));

create policy "Published post crew tags are public" on public.social_post_crew_tags for select using(exists(select 1 from public.social_posts where id=post_id and is_published));
create policy "Authors tag crews" on public.social_post_crew_tags for insert to authenticated with check(exists(select 1 from public.social_posts where id=post_id and author_id=(select auth.uid())));
create policy "Authors remove crew tags" on public.social_post_crew_tags for delete to authenticated using(exists(select 1 from public.social_posts where id=post_id and author_id=(select auth.uid())));

grant select on public.social_post_user_tags,public.social_post_crew_tags to anon,authenticated;
grant insert,delete on public.social_post_user_tags,public.social_post_crew_tags to authenticated;
