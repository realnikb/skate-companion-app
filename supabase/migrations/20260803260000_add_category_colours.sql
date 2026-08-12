alter table public.trick_categories
    add column accent_color text not null default '#9B7CFF',
    add column gradient_start_color text not null default '#6648D6',
    add column gradient_middle_color text not null default '#9B7CFF',
    add column gradient_end_color text not null default '#2A173F';

alter table public.trick_categories
    add constraint trick_categories_accent_color_hex check (accent_color ~ '^#[0-9A-Fa-f]{6}$'),
    add constraint trick_categories_gradient_start_color_hex check (gradient_start_color ~ '^#[0-9A-Fa-f]{6}$'),
    add constraint trick_categories_gradient_middle_color_hex check (gradient_middle_color ~ '^#[0-9A-Fa-f]{6}$'),
    add constraint trick_categories_gradient_end_color_hex check (gradient_end_color ~ '^#[0-9A-Fa-f]{6}$');

update public.trick_categories
set accent_color = palette.accent,
    gradient_start_color = palette.gradient_start,
    gradient_middle_color = palette.gradient_middle,
    gradient_end_color = palette.gradient_end
from (values
    ('riding', '#54B8FF', '#1974D2', '#54B8FF', '#0B1E36'),
    ('flip-tricks', '#ED5CAB', '#C32A7F', '#ED5CAB', '#30112B'),
    ('dark-tricks', '#A870FF', '#6830B5', '#A870FF', '#1C0F2F'),
    ('grinds', '#FF9F50', '#CD6720', '#FF9F50', '#311B0D'),
    ('grabs', '#54D88B', '#20975B', '#54D88B', '#0C2A1C'),
    ('plants', '#C6DF55', '#7D9A23', '#C6DF55', '#222B0D'),
    ('off-board', '#FF6F68', '#CD3E3B', '#FF6F68', '#331212'),
    ('terminology', '#F0C957', '#B4891D', '#F0C957', '#2F250C'),
    ('finger-flips', '#C184FF', '#7540C8', '#C184FF', '#251038')
) as palette(slug, accent, gradient_start, gradient_middle, gradient_end)
where trick_categories.slug = palette.slug;
