create table public.social_post_likes (
    post_id uuid not null references public.social_posts(id) on delete cascade,
    user_id uuid not null references public.profiles(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key(post_id,user_id)
);

create table public.social_post_comments (
    id uuid primary key default gen_random_uuid(),
    post_id uuid not null references public.social_posts(id) on delete cascade,
    user_id uuid not null references public.profiles(id) on delete cascade,
    body text not null check(char_length(body) between 1 and 2000),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index social_post_comments_post_idx on public.social_post_comments(post_id,created_at);
alter table public.social_post_likes enable row level security;
alter table public.social_post_comments enable row level security;
create policy "Published post likes are public" on public.social_post_likes for select using(exists(select 1 from public.social_posts where id=post_id and is_published));
create policy "Players like posts" on public.social_post_likes for insert to authenticated with check(user_id=(select auth.uid()) and exists(select 1 from public.social_posts where id=post_id and is_published));
create policy "Players remove their likes" on public.social_post_likes for delete to authenticated using(user_id=(select auth.uid()));
create policy "Published post comments are public" on public.social_post_comments for select using(exists(select 1 from public.social_posts where id=post_id and is_published));
create policy "Players comment on posts" on public.social_post_comments for insert to authenticated with check(user_id=(select auth.uid()) and exists(select 1 from public.social_posts where id=post_id and is_published));
create policy "Players edit their comments" on public.social_post_comments for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy "Players remove their comments" on public.social_post_comments for delete to authenticated using(user_id=(select auth.uid()));
grant select on public.social_post_likes,public.social_post_comments to anon,authenticated;
grant insert,delete on public.social_post_likes to authenticated;
grant insert,update,delete on public.social_post_comments to authenticated;

create or replace function public.sync_social_post_counts() returns trigger language plpgsql security definer set search_path='' as $$
begin
  update public.social_posts set
    likes_count=(select count(*) from public.social_post_likes where post_id=coalesce(new.post_id,old.post_id)),
    comments_count=(select count(*) from public.social_post_comments where post_id=coalesce(new.post_id,old.post_id))
  where id=coalesce(new.post_id,old.post_id);
  return coalesce(new,old);
end;
$$;
create trigger sync_social_likes after insert or delete on public.social_post_likes for each row execute function public.sync_social_post_counts();
create trigger sync_social_comments after insert or delete on public.social_post_comments for each row execute function public.sync_social_post_counts();
create trigger set_social_post_comments_updated_at before update on public.social_post_comments for each row execute function public.set_updated_at();
