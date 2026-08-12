alter table public.trick_categories
    add column parent_id uuid references public.trick_categories(id) on delete restrict;

insert into public.trick_categories (slug, name, description, sort_order, is_published, parent_id)
select
    'finger-flips',
    'Finger Flips',
    'Finger-flip variations performed from grabs and aerial positions.',
    55,
    true,
    id
from public.trick_categories
where slug = 'grabs'
on conflict (slug) do update
set parent_id = excluded.parent_id,
    name = excluded.name,
    description = excluded.description;

update public.tricks
set category_id = (select id from public.trick_categories where slug = 'finger-flips')
where slug in ('bs-fingerflip', 'fs-fingerflip', 'fingerflip', 'coffin-fingerflip', 'double-grab-fingerflip');

create index trick_categories_parent_id_idx on public.trick_categories(parent_id);
