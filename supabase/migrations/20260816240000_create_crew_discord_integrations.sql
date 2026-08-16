create table public.crew_discord_integrations (
    crew_id uuid primary key references public.crews(id) on delete cascade,
    invite_code text not null check(invite_code ~ '^[A-Za-z0-9_-]{2,64}$'),
    guild_id text not null,
    guild_name text not null check(char_length(guild_name) between 1 and 100),
    guild_icon_url text,
    approximate_member_count integer not null default 0 check(approximate_member_count >= 0),
    approximate_online_count integer not null default 0 check(approximate_online_count >= 0),
    last_synced_at timestamptz,
    created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create unique index crew_discord_guild_id_idx on public.crew_discord_integrations(guild_id);
create trigger set_crew_discord_integrations_updated_at before update on public.crew_discord_integrations
for each row execute function public.set_updated_at();

alter table public.crew_discord_integrations enable row level security;
create policy "Connected Discord communities are public" on public.crew_discord_integrations for select
using(exists(select 1 from public.crews where id=crew_id and is_published));
create policy "Crew staff connect Discord" on public.crew_discord_integrations for insert to authenticated
with check(public.is_crew_staff(crew_id));
create policy "Crew staff update Discord" on public.crew_discord_integrations for update to authenticated
using(public.is_crew_staff(crew_id)) with check(public.is_crew_staff(crew_id));
create policy "Crew staff disconnect Discord" on public.crew_discord_integrations for delete to authenticated
using(public.is_crew_staff(crew_id));

grant select on public.crew_discord_integrations to anon,authenticated;
grant insert,update,delete on public.crew_discord_integrations to authenticated;
