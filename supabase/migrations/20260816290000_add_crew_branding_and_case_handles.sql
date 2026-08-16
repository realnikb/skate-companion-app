alter table public.crews
add column primary_color text not null default '#7957FF',
add constraint crews_primary_color_hex check(primary_color ~ '^#[0-9A-Fa-f]{6}$');

alter table public.profiles drop constraint profiles_handle_key;
alter table public.profiles drop constraint profiles_handle_check;
alter table public.profiles add constraint profiles_handle_check check(handle ~ '^[A-Za-z0-9_]{3,24}$');
create unique index profiles_handle_lower_key on public.profiles(lower(handle));
