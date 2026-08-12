alter table public.trick_categories
    add column hero_image_path text;

comment on column public.trick_categories.hero_image_path is
    'Optional Studio-managed hero background for the public category page.';
