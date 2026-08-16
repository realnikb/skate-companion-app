alter table public.social_posts
add column map_id uuid references public.skate_maps(id) on delete set null,
add column map_position jsonb,
add constraint social_posts_map_pin_complete check((map_id is null and map_position is null) or (map_id is not null and jsonb_typeof(map_position)='array' and jsonb_array_length(map_position)=2));
create index social_posts_map_heatmap_idx on public.social_posts(map_id,created_at desc) where map_id is not null and is_published;
comment on column public.social_posts.map_position is 'Normalized [x,y] percentages within the selected game map, ranging from 0 to 100.';
