alter table public.tricks
    add column difficulty text;

alter table public.tricks
    add constraint tricks_difficulty_check
    check (difficulty in ('beginner', 'intermediate', 'advanced', 'expert'));

comment on column public.tricks.difficulty is
    'Optional editorial difficulty: beginner, intermediate, advanced, or expert.';
