create table public.studio_admins (
    user_id uuid primary key references auth.users(id) on delete cascade,
    created_at timestamptz not null default now()
);

alter table public.studio_admins enable row level security;

create or replace function public.is_studio_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.studio_admins
        where user_id = (select auth.uid())
    );
$$;

revoke all on function public.is_studio_admin() from public;
grant execute on function public.is_studio_admin() to authenticated;

create policy "Studio administrators can see their membership"
    on public.studio_admins for select to authenticated
    using (user_id = (select auth.uid()));

create policy "Studio administrators can read every category"
    on public.trick_categories for select to authenticated
    using ((select public.is_studio_admin()));

create policy "Studio administrators can update categories"
    on public.trick_categories for update to authenticated
    using ((select public.is_studio_admin()))
    with check ((select public.is_studio_admin()));

create policy "Studio administrators can read every trick"
    on public.tricks for select to authenticated
    using ((select public.is_studio_admin()));

create policy "Studio administrators can update tricks"
    on public.tricks for update to authenticated
    using ((select public.is_studio_admin()))
    with check ((select public.is_studio_admin()));

grant select on public.studio_admins to authenticated;
grant update on public.trick_categories, public.tricks to authenticated;

comment on table public.studio_admins is
    'Allowlist for accounts permitted to access Skate Companion Studio.';
