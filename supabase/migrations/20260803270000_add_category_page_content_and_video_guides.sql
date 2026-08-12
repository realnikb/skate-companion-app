alter table public.trick_categories
    add column page_eyebrow text,
    add column page_heading text,
    add column popular_heading text;

alter table public.tricks
    add column guide_video_path text;

comment on column public.trick_categories.page_eyebrow is 'Optional eyebrow shown above the category page hero heading.';
comment on column public.trick_categories.page_heading is 'Optional hero heading. Use {category} to insert the category name.';
comment on column public.trick_categories.popular_heading is 'Optional heading above the popular trick cards. Use {category} to insert the category name.';
comment on column public.tricks.guide_video_path is 'Optional instructional guide clip, separate from the trick demonstration video.';
