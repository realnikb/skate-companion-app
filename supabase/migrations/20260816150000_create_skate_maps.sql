create table public.skate_maps (
    id uuid primary key default gen_random_uuid(), slug text not null unique, name text not null,
    description text, asset_root text not null, tile_url text not null default 'tiles/{z}/{x}/{y}.webp',
    tile_size integer not null default 256, min_zoom numeric not null default 0, max_zoom numeric not null default 5,
    bounds jsonb not null default '[[-135,0],[0,240]]'::jsonb, is_published boolean not null default false,
    created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.map_districts (
    id uuid primary key default gen_random_uuid(), map_id uuid not null references public.skate_maps(id) on delete cascade,
    slug text not null, name text not null, colour text not null default '#3d7eff', icon_path text,
    marker_position jsonb, polygon jsonb not null default '[]'::jsonb, sort_order integer not null default 0,
    created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(map_id, slug)
);

create table public.map_spots (
    id uuid primary key default gen_random_uuid(), map_id uuid not null references public.skate_maps(id) on delete cascade,
    district_id uuid references public.map_districts(id) on delete set null, created_by uuid references auth.users(id) on delete set null,
    slug text not null, name text not null, description text not null default '', category text not null default 'community',
    position jsonb not null, is_published boolean not null default false, created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(), unique(map_id, slug)
);

alter table public.skate_maps enable row level security;
alter table public.map_districts enable row level security;
alter table public.map_spots enable row level security;
create policy "Published maps are public" on public.skate_maps for select using (is_published or public.is_studio_admin());
create policy "Published map districts are public" on public.map_districts for select using (exists(select 1 from public.skate_maps m where m.id=map_id and m.is_published) or public.is_studio_admin());
create policy "Published spots are public" on public.map_spots for select using (is_published or public.is_studio_admin());
create policy "Studio manages maps" on public.skate_maps for all to authenticated using (public.is_studio_admin()) with check (public.is_studio_admin());
create policy "Studio manages districts" on public.map_districts for all to authenticated using (public.is_studio_admin()) with check (public.is_studio_admin());
create policy "Studio manages spots" on public.map_spots for all to authenticated using (public.is_studio_admin()) with check (public.is_studio_admin());
grant select on public.skate_maps, public.map_districts, public.map_spots to anon, authenticated;
grant insert, update, delete on public.skate_maps, public.map_districts, public.map_spots to authenticated;

insert into public.skate_maps(id,slug,name,description,asset_root,is_published)
values ('00000000-0000-4000-8000-000000000001','san-van','San Vansterdam','Downtown districts','/maps/san-van',true);
insert into public.map_districts(map_id,slug,name,colour,icon_path,marker_position,polygon,sort_order) values
('00000000-0000-4000-8000-000000000001','gullcrest-village','Gullcrest Village','#d3a915','/maps/san-van/icons/gullcrest_village.png','[31,35]','[[28,8],[47,3],[49,42],[40,43],[43,58],[33,61],[25,50],[13,54],[20,24]]',10),
('00000000-0000-4000-8000-000000000001','hedgemont','Hedgemont','#b238d0','/maps/san-van/icons/hedgemont.png','[63,30]','[[48,3],[70,5],[78,17],[81,53],[52,48],[49,42]]',20),
('00000000-0000-4000-8000-000000000001','market-mile','Market Mile','#3881d9','/maps/san-van/icons/market_mile.png','[35,70]','[[13,54],[25,50],[33,61],[43,58],[51,49],[52,94],[42,97],[28,91],[19,74]]',30),
('00000000-0000-4000-8000-000000000001','brickswich','Brickswich','#d2585e','/maps/san-van/icons/brickswich.png','[68,72]','[[51,49],[81,53],[82,70],[76,80],[65,89],[52,94]]',40);
