alter table public.crews alter column owner_id drop not null;

comment on column public.crews.owner_id is
    'The player profile that owns this crew. Null while a Studio-created crew is awaiting its owner.';
