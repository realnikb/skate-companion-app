alter table public.social_post_comments
add column media_path text,
add column media_type text check(media_type is null or media_type in ('image','video'));
comment on column public.social_post_comments.media_path is 'Optional image or video reply stored in the social-media bucket.';
