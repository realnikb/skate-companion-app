update public.tricks
set aliases = array_append(coalesce(aliases, array[]::text[]), 'Mute')
where (
    name ilike '%weddle%'
    or slug ilike '%weddle%'
    or exists (
        select 1
        from unnest(coalesce(aliases, array[]::text[])) as alias
        where alias ilike '%weddle%'
    )
)
and not exists (
    select 1
    from unnest(coalesce(aliases, array[]::text[])) as alias
    where lower(alias) = 'mute'
);
