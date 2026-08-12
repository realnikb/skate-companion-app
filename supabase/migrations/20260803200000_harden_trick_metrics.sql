insert into public.trick_metrics (trick_id)
select id from public.tricks
on conflict (trick_id) do nothing;

create or replace function public.record_trick_view(target_trick_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.trick_metrics (trick_id, view_count)
    select target_trick_id, 1
    where exists (
        select 1 from public.tricks
        where id = target_trick_id and is_published
    )
    on conflict (trick_id) do update
        set view_count = trick_metrics.view_count + 1,
            updated_at = now();
    return;
end;
$$;

create or replace function public.change_trick_favourite(target_trick_id uuid, amount integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    bounded_amount integer := greatest(-1, least(1, amount));
begin
    insert into public.trick_metrics (trick_id, favourite_count)
    select target_trick_id, greatest(0, bounded_amount)
    where exists (
        select 1 from public.tricks
        where id = target_trick_id and is_published
    )
    on conflict (trick_id) do update
        set favourite_count = greatest(0, trick_metrics.favourite_count + bounded_amount),
            updated_at = now();
    return;
end;
$$;

revoke all on function public.record_trick_view(uuid) from public;
revoke all on function public.change_trick_favourite(uuid, integer) from public;
grant execute on function public.record_trick_view(uuid) to anon, authenticated;
grant execute on function public.change_trick_favourite(uuid, integer) to anon, authenticated;
