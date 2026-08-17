alter table public.profiles
    add column playstation_gamertag text check (char_length(playstation_gamertag) <= 64),
    add column xbox_gamertag text check (char_length(xbox_gamertag) <= 64),
    add column ea_id text check (char_length(ea_id) <= 64),
    add column steam_gamertag text check (char_length(steam_gamertag) <= 64),
    add column youtube_url text check (youtube_url is null or youtube_url ~ '^https://'),
    add column tiktok_url text check (tiktok_url is null or tiktok_url ~ '^https://'),
    add column instagram_url text check (instagram_url is null or instagram_url ~ '^https://');
