# Skate Companion

Skate Companion is an unofficial resource for *skate.* It combines a searchable Skatepedia, interactive maps and spots, community social features, crews, news, and an administrator-only content studio.

It is a Next.js App Router project backed by Supabase for authentication, Postgres data, row-level security (RLS), and media storage.

## Contents

- [Architecture](#architecture)
- [Local setup](#local-setup)
- [Configuration](#configuration)
- [Features and routes](#features-and-routes)
- [Data, storage, and access](#data-storage-and-access)
- [Content workflows](#content-workflows)
- [Development and deployment](#development-and-deployment)

## Architecture

```text
Browser
  └─ Next.js 16 / React 19
       ├─ Public site: src/app/(site)
       ├─ Studio:      src/app/studio
       ├─ APIs:        src/app/api
       └─ Components:  src/components
              │
              ├─ Server Actions and server-side query helpers
              ├─ Supabase SSR clients and session-refresh proxy
              └─ Supabase: Auth, Postgres + RLS, and Storage
```

Most page data is loaded with server-side helpers in `src/lib`. Interactive client components call Server Actions, or the browser Supabase client when an upload needs progress feedback. `src/proxy.ts` refreshes Supabase auth cookies for matching requests.

## Local setup

Requirements:

- Node.js 24 (pinned in `.nvmrc`)
- npm 11
- Docker and Supabase CLI for a local Supabase stack

Use npm only. `package-lock.json` is authoritative; do not commit lockfiles from other package managers.

```bash
nvm use
npm ci
cp .env.example .env.local
npm run dev
```

Open <http://localhost:3000>.

### Local database

```bash
supabase start
supabase db reset
```

`supabase db reset` applies every migration in `supabase/migrations` and loads `supabase/seed.sql`. Local service defaults are in `supabase/config.toml`; put the local API URL and publishable key in `.env.local`.

### Hosted database

```bash
supabase login
supabase link --project-ref your-project-ref
supabase db push
npm run db:types
```

For a new development or staging project, seed data can be included explicitly:

```bash
supabase db push --include-seed
```

Review `supabase/seed.sql` before using `--include-seed` against shared or production data.

## Configuration

Copy `.env.example` to `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Do not commit `.env.local`, service-role keys, or provider secrets. The publishable key may be used by the browser; access is enforced with Supabase RLS policies in `supabase/migrations`.

For hosted Supabase Auth, set the site URL and allowed redirect URLs for the deployed domain and local development. The sign-in callback endpoint is `/auth/callback`; it only permits safe local `next` paths before redirecting.

## Features and routes

| Route | Feature | Main implementation |
| --- | --- | --- |
| `/` | Landing page and discovery | `src/components/home` |
| `/tricks`, `/tricks/[slug]` | Trick directory, guide, controls, stick paths, and video | `src/lib/tricks`, `src/components/tricks` |
| `/spots` | Published maps/spots, reviews, and community media | `src/components/spots` |
| `/social`, `/social/footy` | Community and video-focused social feeds | `src/components/social` |
| `/social/[username]` | Skater profile | `src/app/(site)/social/[username]` |
| `/social/crews`, `/social/crew/[slug]` | Crew discovery and profiles | `src/components/crews`, `src/lib/crews` |
| `/account` | Account and profile management | `src/app/(site)/account` |
| `/account/sign-in`, `/account/sign-up` | Email/password authentication | `src/app/account` |
| `/news/...`, `/seasons/[slug]`, `/[pageSlug]` | Editorial and CMS content | `src/app/(site)` |

### Studio

Every `/studio` route requires an authenticated user whose ID is in `studio_admins`. Unauthenticated visitors are redirected to sign-in; signed-in non-admins receive a not-found response.

| Studio area | Manages |
| --- | --- |
| `/studio/tricks` | Tricks, media, controls, aliases, and publication state |
| `/studio/stick-paths` | Controller stick paths and bulk import |
| `/studio/categories` | Categories, ordering, page content, and themes |
| `/studio/maps` | Maps and districts |
| `/studio/spots` | Authored spots and publishing |
| `/studio/crews` | Crews, branding, rosters, links, and releases |
| `/studio/pages` | CMS public pages |

## Data, storage, and access

The migration history is the database and authorization source of truth. Generated TypeScript database types are committed at `src/types/database.ts`; after a schema change, link the target project and run:

```bash
npm run db:types
```

| Domain | Core tables |
| --- | --- |
| Skatepedia / Studio | `studio_admins`, `trick_categories`, `tricks`, `trick_metrics`, `stick_paths` |
| Accounts / crews | `profiles`, `crews`, `crew_members`, `crew_links`, `crew_videos`, `crew_discord_integrations` |
| Maps / spots | `skate_maps`, `map_districts`, `map_spots`, `spot_reviews`, `spot_media`, `spot_comments` |
| Social | `social_posts`, `social_post_media`, `social_post_likes`, `social_post_comments`, `social_post_user_tags`, `social_post_crew_tags` |
| Editorial | `content_pages` |

| Storage bucket | Contents |
| --- | --- |
| `trick-media` | Skatepedia clips, posters, and control images |
| `profile-media` | Player avatars |
| `crew-media` | Crew logos, banners, and media |
| `social-media` | Social post media and comment attachments |
| `spot-media` | Community spot photos and videos |

Buckets are public where the feature needs public rendering, but storage policies and table RLS limit mutation. Upload paths are normally scoped by authenticated user ID. Never bypass that model with a service-role key in frontend code.

Access model:

- Public visitors read published content.
- Authenticated players manage their profile and permitted community content.
- Crew owners/staff manage their crew resources.
- Studio administrators manage authored and editorial content.

Keep authorization in RLS policies and the existing server-side guards; UI checks are not a security boundary.

## Content workflows

### Refresh the trick catalog seed

The original trick and controller-input data was created with an OCR reader that analysed Skatepedia screen recordings. Use the catalog generator to produce a deterministic seed from its validated JSON input:

```bash
npm run db:seed:generate -- path/to/skatepedia.json
```

Input records must have a unique slug and `video_file`, `controls_reference_file`, and `controls_clean_file` media fields. An optional second argument changes the SQL output path. The generator validates the input before writing output. Database rows store bucket-relative paths, so catalog data can move between Supabase projects when matching `trick-media` assets are present.

### Change schema or permissions

1. Add a timestamped migration to `supabase/migrations`.
2. Add RLS and Storage policies when relevant.
3. Test it locally with `supabase db reset`.
4. Regenerate `src/types/database.ts`.
5. Review and apply with `supabase db push`.

Never edit an already-applied migration to change a deployed schema; create a new migration.

### Update the San Van map bundle

`public/maps/san-van` is a portable Leaflet map package that uses `L.CRS.Simple`, not geographic coordinates. Read [its guide](public/maps/san-van/README.md) before changing tiles, the manifest, icons, or GeoJSON.

## Development and deployment

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server. |
| `npm run lint` | Run ESLint. |
| `npm run build` | Produce a production build. |
| `npm run start` | Serve an existing production build. |
| `npm run format` | Format the repository with Prettier. |
| `npm run db:seed:generate -- <file>` | Generate Skatepedia seed SQL. |
| `npm run db:types` | Generate types from the linked Supabase project. |

Before a pull request or release, run:

```bash
npm run lint
npm run build
```

Conventions:

- `src/app/(site)` is the public site; `src/app/studio` is the admin area.
- Use `src/lib/supabase/server.ts` in server code and `src/lib/supabase/client.ts` in client components.
- Keep reusable feature queries/mapping in `src/lib/<feature>` and UI in `src/components/<feature>`.
- Prefer Server Actions for app mutations; use route handlers only where an external caller needs an HTTP endpoint.
- Read `AGENTS.md` before Next.js changes: this project uses a version with breaking changes from earlier conventions.

The app can deploy to a standard Next.js host such as Vercel. Release in this order:

1. Run lint and a production build.
2. Review/apply target Supabase migrations.
3. Regenerate and commit types if the schema changed.
4. Configure the two `NEXT_PUBLIC_SUPABASE_*` environment variables.
5. Set Supabase Auth site/redirect URLs for the domain.
6. Deploy and verify sign-in, a Studio route, media upload, and a public page.

## Project map

```text
src/
  app/                 routes, layouts, actions, and route handlers
  components/          feature UI and shared primitives
  hooks/               browser-side preferences and saved-session hooks
  lib/                 Supabase clients, feature queries, helpers, and auth guards
  types/               application and generated database types
supabase/
  migrations/          ordered schema, RLS, and Storage policy changes
  seed.sql             local/reset seed data
  config.toml          local Supabase configuration
public/maps/san-van/   portable raster map bundle and metadata
scripts/               catalog tooling
```

## Troubleshooting

| Symptom | First checks |
| --- | --- |
| “Supabase is not configured” | Put both variables in `.env.local` and restart Next. |
| Sign-in callback fails | Check Supabase Auth site/redirect URLs and `/auth/callback`. |
| Studio is 404 for a signed-in user | Add the user ID to `studio_admins` in the correct project. |
| A database field is absent in TypeScript | Apply migration, link project, run `npm run db:types`. |
| Upload is rejected | Check bucket MIME/size policy, user-scoped path, and table RLS. |
| Local data is unexpected | `supabase db reset` recreates the local database and loads `seed.sql`. |
