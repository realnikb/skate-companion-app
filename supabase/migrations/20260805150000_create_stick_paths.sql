create table public.stick_paths (
    id uuid primary key default gen_random_uuid(),
    slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
    name text not null,
    points jsonb not null default '[{"x":0,"y":0}]'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create trigger set_stick_paths_updated_at
    before update on public.stick_paths
    for each row execute function public.set_updated_at();

alter table public.stick_paths enable row level security;

create policy "Studio admins can read stick paths"
    on public.stick_paths for select to authenticated
    using ((select public.is_studio_admin()));

create policy "Studio admins can create stick paths"
    on public.stick_paths for insert to authenticated
    with check ((select public.is_studio_admin()));

create policy "Studio admins can update stick paths"
    on public.stick_paths for update to authenticated
    using ((select public.is_studio_admin()))
    with check ((select public.is_studio_admin()));

grant select, insert, update on public.stick_paths to authenticated;
