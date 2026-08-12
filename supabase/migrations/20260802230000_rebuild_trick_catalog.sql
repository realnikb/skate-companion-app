drop table if exists public.trick_metrics cascade;
drop table if exists public.tricks cascade;
drop table if exists public.trick_categories cascade;
drop function if exists public.record_trick_view(uuid);
drop function if exists public.change_trick_favourite(uuid, integer);

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
    detected_description text,
    context text,
    aliases text[] not null default '{}'::text[],
    controls jsonb not null default '[]'::jsonb,
    video_path text not null,
    poster_path text,
    controls_reference_path text not null,
    controls_clean_path text not null,
    source_frame_path text,
    source_start_seconds numeric,
    source_end_seconds numeric,
    ocr_confidence numeric,
    needs_name_review boolean not null default false,
    needs_control_review boolean not null default false,
    needs_description_review boolean not null default false,
    sort_order integer not null default 0,
    is_published boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint tricks_source_time_order check (
        source_start_seconds is null
        or source_end_seconds is null
        or source_end_seconds >= source_start_seconds
    ),
    constraint tricks_ocr_confidence_range check (
        ocr_confidence is null or ocr_confidence between 0 and 100
    )
);

create table public.trick_metrics (
    trick_id uuid primary key references public.tricks(id) on delete cascade,
    view_count bigint not null default 0 check (view_count >= 0),
    favourite_count bigint not null default 0 check (favourite_count >= 0),
    updated_at timestamptz not null default now()
);

create index trick_categories_published_order_idx
    on public.trick_categories (sort_order, name)
    where is_published;
create index tricks_category_id_idx on public.tricks (category_id);
create index tricks_published_order_idx
    on public.tricks (category_id, sort_order, name)
    where is_published;
create index tricks_name_trgm_idx on public.tricks using gin (name gin_trgm_ops);
create index tricks_aliases_gin_idx on public.tricks using gin (aliases);

create trigger set_trick_categories_updated_at
    before update on public.trick_categories
    for each row execute function public.set_updated_at();
create trigger set_tricks_updated_at
    before update on public.tricks
    for each row execute function public.set_updated_at();

create or replace function public.ensure_trick_metrics()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.trick_metrics (trick_id) values (new.id)
    on conflict (trick_id) do nothing;
    return new;
end;
$$;

create trigger ensure_trick_metrics_after_insert
    after insert on public.tricks
    for each row execute function public.ensure_trick_metrics();

create or replace function public.record_trick_view(target_trick_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
    update public.trick_metrics
    set view_count = view_count + 1, updated_at = now()
    where trick_id = target_trick_id
      and exists (select 1 from public.tricks where id = target_trick_id and is_published);
$$;

create or replace function public.change_trick_favourite(target_trick_id uuid, amount integer)
returns void
language sql
security definer
set search_path = public
as $$
    update public.trick_metrics
    set favourite_count = greatest(0, favourite_count + amount), updated_at = now()
    where trick_id = target_trick_id
      and amount in (-1, 1)
      and exists (select 1 from public.tricks where id = target_trick_id and is_published);
$$;

alter table public.trick_categories enable row level security;
alter table public.tricks enable row level security;
alter table public.trick_metrics enable row level security;

create policy "Published categories are publicly readable"
    on public.trick_categories for select to anon, authenticated using (is_published);
create policy "Published tricks in published categories are publicly readable"
    on public.tricks for select to anon, authenticated
    using (
        is_published and exists (
            select 1 from public.trick_categories
            where trick_categories.id = tricks.category_id and trick_categories.is_published
        )
    );
create policy "Trick metrics are publicly readable"
    on public.trick_metrics for select to anon, authenticated using (true);

grant select on public.trick_categories, public.tricks, public.trick_metrics to anon, authenticated;
revoke all on function public.record_trick_view(uuid) from public;
revoke all on function public.change_trick_favourite(uuid, integer) from public;
grant execute on function public.record_trick_view(uuid) to anon, authenticated;
grant execute on function public.change_trick_favourite(uuid, integer) to anon, authenticated;
