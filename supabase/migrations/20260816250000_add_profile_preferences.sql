alter table public.profiles
    add column preferred_controller text not null default 'xbox' check (preferred_controller in ('xbox', 'playstation')),
    add column stance text not null default 'regular' check (stance in ('regular', 'goofy'));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-media', 'profile-media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update set public=true, file_size_limit=excluded.file_size_limit, allowed_mime_types=excluded.allowed_mime_types;

create policy "Profile pictures are public" on storage.objects for select using (bucket_id='profile-media');
create policy "Players upload their profile picture" on storage.objects for insert to authenticated
with check (bucket_id='profile-media' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "Players update their profile picture" on storage.objects for update to authenticated
using (bucket_id='profile-media' and owner_id=(select auth.uid()::text))
with check (bucket_id='profile-media' and owner_id=(select auth.uid()::text));
create policy "Players delete their profile picture" on storage.objects for delete to authenticated
using (bucket_id='profile-media' and owner_id=(select auth.uid()::text));
