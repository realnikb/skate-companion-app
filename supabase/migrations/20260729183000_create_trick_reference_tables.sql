create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create table public.trick_categories (
    id uuid primary key default gen_random_uuid(),
    slug text not null unique,
    name text not null,
    description text,
    sort_order integer not null default 0,
    is_published boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.tricks (
    id uuid primary key default gen_random_uuid(),
    category_id uuid not null references public.trick_categories(id) on delete restrict,
    slug text not null unique,
    name text not null,
    description text not null,
    context text,
    aliases text[] not null default '{}'::text[],
    controls jsonb not null default '[]'::jsonb,
    video_url text,
    poster_url text,
    sort_order integer not null default 0,
    is_published boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index trick_categories_published_order_idx
    on public.trick_categories (sort_order, name)
    where is_published;

create index tricks_category_id_idx
    on public.tricks (category_id);

create index tricks_published_order_idx
    on public.tricks (category_id, sort_order, name)
    where is_published;

create index tricks_name_trgm_idx
    on public.tricks
    using gin (name gin_trgm_ops);

create index tricks_aliases_gin_idx
    on public.tricks
    using gin (aliases);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create trigger set_trick_categories_updated_at
    before update on public.trick_categories
    for each row
    execute function public.set_updated_at();

create trigger set_tricks_updated_at
    before update on public.tricks
    for each row
    execute function public.set_updated_at();

alter table public.trick_categories enable row level security;
alter table public.tricks enable row level security;

create policy "Published categories are publicly readable"
    on public.trick_categories
    for select
    to anon
    using (is_published);

create policy "Published tricks in published categories are publicly readable"
    on public.tricks
    for select
    to anon
    using (
        is_published
        and exists (
            select 1
            from public.trick_categories
            where trick_categories.id = tricks.category_id
                and trick_categories.is_published
        )
    );
