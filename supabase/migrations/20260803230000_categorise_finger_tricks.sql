do $$
declare
    finger_flips_category_id uuid;
begin
    select id
    into finger_flips_category_id
    from public.trick_categories
    where slug = 'finger-flips';

    if finger_flips_category_id is null then
        raise exception 'The finger-flips category does not exist.';
    end if;

    update public.tricks
    set category_id = finger_flips_category_id
    where
        name ilike '%finger%'
        or slug ilike '%finger%'
        or exists (
            select 1
            from unnest(aliases) as alias
            where alias ilike '%finger%'
        );
end
$$;
