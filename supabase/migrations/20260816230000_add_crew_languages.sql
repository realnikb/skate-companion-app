alter table public.crews
add column languages text[] not null default array['en']::text[]
check(cardinality(languages) between 1 and 12);

comment on column public.crews.languages is 'ISO 639-1 language codes spoken by the crew, stored in lowercase.';

create index crews_languages_idx on public.crews using gin(languages);
