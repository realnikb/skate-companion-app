insert into public.tricks (
    category_id,
    slug,
    name,
    description,
    context,
    aliases,
    controls,
    sort_order,
    is_published
)
select
    trick_categories.id,
    'nosegrind',
    'Nosegrind',
    'Lock the front truck onto a ledge or rail, balance over the nose, and guide the board through the grind.',
    'Ledge or rail',
    array['nose grind']::text[],
    '[{"type":"trigger","side":"left","action":"hold"},{"type":"stick","stick":"left","action":"hold","movement":"weight-forward"}]'::jsonb,
    10,
    true
from public.trick_categories
where slug = 'grinds'
on conflict (slug) do update
set
    category_id = excluded.category_id,
    name = excluded.name,
    description = excluded.description,
    context = excluded.context,
    aliases = excluded.aliases,
    controls = excluded.controls,
    sort_order = excluded.sort_order,
    is_published = excluded.is_published;
