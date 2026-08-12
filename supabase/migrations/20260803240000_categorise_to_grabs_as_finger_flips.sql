do $$
declare
    grabs_category_id uuid;
    finger_flips_category_id uuid;
begin
    select id
    into grabs_category_id
    from public.trick_categories
    where slug = 'grabs';

    select id
    into finger_flips_category_id
    from public.trick_categories
    where slug = 'finger-flips';

    if grabs_category_id is null then
        raise exception 'The grabs category does not exist.';
    end if;

    if finger_flips_category_id is null then
        raise exception 'The finger-flips category does not exist.';
    end if;

    update public.tricks
    set category_id = finger_flips_category_id
    where category_id = grabs_category_id
      and (
          name ~* '(^|[[:space:]])to([[:space:]]|$)'
          or slug ~* '(^|-)to(-|$)'
      );
end
$$;
