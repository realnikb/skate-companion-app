alter table public.social_posts
add column media_type text check(media_type is null or media_type in ('image','video'));

update storage.buckets
set file_size_limit=104857600,
    allowed_mime_types=array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm','video/quicktime']
where id='social-media';

comment on column public.social_posts.media_type is 'The uploaded social-media attachment type. External video links remain supported for older posts.';
