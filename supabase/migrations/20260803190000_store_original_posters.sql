alter table public.tricks
    add column original_poster_path text;

comment on column public.tricks.original_poster_path is
    'Uncropped source artwork used for the atmospheric trick-page background.';
