alter table public.tricks
    add column last_edited_by text;

comment on column public.tricks.last_edited_by is
    'Email address of the studio administrator who most recently saved this trick.';
