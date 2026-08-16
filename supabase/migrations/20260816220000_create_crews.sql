create table public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    handle text not null unique check(handle ~ '^[a-z0-9_]{3,24}$'),
    display_name text not null check(char_length(display_name) between 1 and 50),
    avatar_path text,
    bio text check(char_length(bio) <= 500),
    created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.crews (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references public.profiles(id) on delete restrict,
    slug text not null unique check(slug ~ '^[a-z0-9-]{3,48}$'),
    name text not null check(char_length(name) between 2 and 60),
    tagline text check(char_length(tagline) <= 100), description text check(char_length(description) <= 2000),
    logo_path text not null, banner_path text,
    location text, platform text,
    styles text[] not null default '{}',
    recruitment_status text not null default 'closed' check(recruitment_status in ('recruiting','invite-only','closed')),
    recruitment_details text check(char_length(recruitment_details) <= 1500),
    is_published boolean not null default true,
    created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.crew_members (
    crew_id uuid not null references public.crews(id) on delete cascade,
    user_id uuid not null references public.profiles(id) on delete cascade,
    role text not null default 'member' check(role in ('owner','co-owner','captain','recruiter','filmer','member','prospect')),
    joined_at timestamptz not null default now(), primary key(crew_id,user_id)
);

create table public.crew_links (
    id uuid primary key default gen_random_uuid(), crew_id uuid not null references public.crews(id) on delete cascade,
    platform text not null check(platform in ('discord','youtube','tiktok','instagram','twitch','website')),
    url text not null check(url ~ '^https://'), sort_order integer not null default 0,
    unique(crew_id,platform)
);

create table public.crew_videos (
    id uuid primary key default gen_random_uuid(), crew_id uuid not null references public.crews(id) on delete cascade,
    created_by uuid references public.profiles(id) on delete set null,
    title text not null check(char_length(title) between 1 and 120), description text check(char_length(description) <= 2000),
    video_url text not null check(video_url ~ '^https://'), thumbnail_path text,
    video_type text not null default 'clip' check(video_type in ('clip','part','crew-tape','session','trick-line','battle')),
    is_published boolean not null default true, published_at timestamptz not null default now(), created_at timestamptz not null default now()
);

create index crews_owner_id_idx on public.crews(owner_id);
create index crews_recruitment_idx on public.crews(recruitment_status) where is_published;
create index crew_members_user_id_idx on public.crew_members(user_id);
create index crew_videos_crew_published_idx on public.crew_videos(crew_id,published_at desc) where is_published;

create trigger set_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger set_crews_updated_at before update on public.crews for each row execute function public.set_updated_at();

create or replace function public.is_crew_staff(target_crew_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
    select exists(select 1 from public.crews where id=target_crew_id and owner_id=(select auth.uid()))
        or exists(select 1 from public.crew_members where crew_id=target_crew_id and user_id=(select auth.uid()) and role in ('co-owner','captain','recruiter'));
$$;

alter table public.profiles enable row level security;
alter table public.crews enable row level security;
alter table public.crew_members enable row level security;
alter table public.crew_links enable row level security;
alter table public.crew_videos enable row level security;

create policy "Profiles are public" on public.profiles for select using(true);
create policy "Players create their profile" on public.profiles for insert to authenticated with check(id=(select auth.uid()));
create policy "Players update their profile" on public.profiles for update to authenticated using(id=(select auth.uid())) with check(id=(select auth.uid()));
create policy "Published crews are public" on public.crews for select using(is_published or public.is_crew_staff(id));
create policy "Players create crews they own" on public.crews for insert to authenticated with check(owner_id=(select auth.uid()));
create policy "Owners update crews" on public.crews for update to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
create policy "Owners delete crews" on public.crews for delete to authenticated using(owner_id=(select auth.uid()));
create policy "Crew rosters are public" on public.crew_members for select using(exists(select 1 from public.crews where id=crew_id and is_published));
create policy "Crew staff manage rosters" on public.crew_members for all to authenticated using(public.is_crew_staff(crew_id)) with check(public.is_crew_staff(crew_id));
create policy "Crew links are public" on public.crew_links for select using(exists(select 1 from public.crews where id=crew_id and is_published));
create policy "Crew staff manage links" on public.crew_links for all to authenticated using(public.is_crew_staff(crew_id)) with check(public.is_crew_staff(crew_id));
create policy "Published crew videos are public" on public.crew_videos for select using(is_published and exists(select 1 from public.crews where id=crew_id and is_published));
create policy "Crew staff manage videos" on public.crew_videos for all to authenticated using(public.is_crew_staff(crew_id)) with check(public.is_crew_staff(crew_id));

grant select on public.profiles,public.crews,public.crew_members,public.crew_links,public.crew_videos to anon,authenticated;
grant insert,update on public.profiles to authenticated;
grant insert,update,delete on public.crews,public.crew_members,public.crew_links,public.crew_videos to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('crew-media','crew-media',true,52428800,array['image/jpeg','image/png','image/webp','image/gif'])
on conflict(id) do update set public=true,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy "Crew media is public" on storage.objects for select using(bucket_id='crew-media');
create policy "Players upload crew media" on storage.objects for insert to authenticated with check(bucket_id='crew-media' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "Players manage their crew media" on storage.objects for update to authenticated using(bucket_id='crew-media' and owner_id=(select auth.uid()::text));
create policy "Players delete their crew media" on storage.objects for delete to authenticated using(bucket_id='crew-media' and owner_id=(select auth.uid()::text));
