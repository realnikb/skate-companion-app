create table public.trick_metrics (
    trick_id uuid primary key references public.tricks(id) on delete cascade,
    view_count bigint not null default 0 check (view_count >= 0),
    favourite_count bigint not null default 0 check (favourite_count >= 0),
    updated_at timestamptz not null default now()
);

insert into public.trick_metrics (trick_id)
select id from public.tricks
on conflict (trick_id) do nothing;

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
returns bigint
language sql
security definer
set search_path = public
as $$
    update public.trick_metrics
    set view_count = view_count + 1, updated_at = now()
    where trick_id = target_trick_id
      and exists (select 1 from public.tricks where id = target_trick_id and is_published)
    returning view_count;
$$;

create or replace function public.change_trick_favourite(target_trick_id uuid, amount integer)
returns bigint
language sql
security definer
set search_path = public
as $$
    update public.trick_metrics
    set favourite_count = greatest(0, favourite_count + greatest(-1, least(1, amount))), updated_at = now()
    where trick_id = target_trick_id
      and exists (select 1 from public.tricks where id = target_trick_id and is_published)
    returning favourite_count;
$$;

alter table public.trick_metrics enable row level security;

create policy "Trick metrics are publicly readable"
    on public.trick_metrics for select to anon using (true);

revoke all on function public.record_trick_view(uuid) from public;
revoke all on function public.change_trick_favourite(uuid, integer) from public;
grant execute on function public.record_trick_view(uuid) to anon, authenticated;
grant execute on function public.change_trick_favourite(uuid, integer) to anon, authenticated;
