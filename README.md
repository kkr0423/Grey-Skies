# Grey Skies

One Next.js codebase, split by route (spec: `../Grey Skies Requirements/`,
condensed in `CLAUDE.md`):

| Route | Product |
| --- | --- |
| `/`, `/journal/<slug>`, `/about` | Phase 1: Journal (Markdown, static) |
| `/looks` | Phase 2: Looks — "coming soon" page with email signup |
| `/looks/login`, `/looks/signup`, `/looks/archive` | Looks M1 (works by direct URL) |

Old `/archive`, `/login` and `/signup` redirect to the `/looks/...` paths.
`/auth/callback` is unchanged, so Supabase redirect URLs stay as they are.

## Journal

- Articles: `content/journal/YYYY-MM-DD-slug.md` (copy `_template.md`).
  Images: `content/images/` (copied to `public/journal-images/` before
  `dev`/`build`; that folder is generated and gitignored).
- Frontmatter: `title`, `slug`, `date`, `hero`, `og_description`, `draft`.
  Anything without an explicit `draft: false` is a draft: hidden from
  production builds, shown with a "Draft" label in `npm run dev`.
- Publish: set `draft: false`, commit, push. Vercel deploys.
- Each article gets a generated OGP image (`opengraph-image.tsx`) from its
  hero (JPEG/PNG) and title.
- Set `NEXT_PUBLIC_SITE_URL` once the domain is decided; until then the
  Vercel production URL is used for absolute OGP URLs.
- Footer / `/looks` signup writes to `public.signups` (run
  `supabase/signups.sql` once). Read signups in the Supabase console.

# Looks

The UI is styled with Tailwind (overcast grey palette, Bricolage Grotesque,
light/dark via `prefers-color-scheme`; tokens live in `src/app/globals.css`).
There is no animation yet: GSAP and motion are deferred to M2.

## M1 scope

| #    | Feature                                                                       |
| ---- | ----------------------------------------------------------------------------- |
| F-01 | Email + password signup/login, email confirmation required                    |
| F-02 | `profiles` row created on first login                                         |
| F-03 | Post a look: one image + worn-on date + optional caption (private by default) |
| F-04 | `/looks/archive`: your own looks                                                   |
| F-05 | Log out                                                                       |
| F-06 | Deploy to Vercel                                                              |

Tables used: `profiles`, `looks`, `look_images` (`supabase/schema.sql` is the
full spec schema, including M3/M4 tables).

Images go to Cloudinary through a server action as `type: authenticated`.
Only `public_id` / `version` / `width` / `height` are stored; delivery URLs
are signed and built at render time (`src/lib/images.ts`) with `f_auto,q_auto`
and `srcset`, so thumbnails never receive the original.

## Setup

1. Create a Supabase project and run `supabase/schema.sql`, then
   `supabase/signups.sql`, in the SQL Editor.
2. Auth settings: keep "Confirm email" enabled. Enable a Spend Cap.
3. Create a Cloudinary account (no preset needed).
4. `cp .env.local.example .env.local` and fill in the values.
5. `npm install && npm run dev`
6. For local sign-up, add `http://localhost:3000/auth/callback` to Supabase
   Auth → URL Configuration → Redirect URLs.

`supabase/schema.sql` is not re-runnable. If it fails partway, drop the
tables (`look_tags, tags, hypes, reports, look_images, looks, profiles`) and
`public.bump_hype_count()` with `cascade`, then run it again.

## Deploy (F-06)

Set the five env vars from `.env.local.example` in Vercel. Add the Vercel URL
to Supabase Auth → URL Configuration (Site URL and Redirect URLs, including
`/auth/callback`), or confirmation links will fail.

## Known limits

- Cloudinary `sign_url` prevents tampering but URLs never expire. Accepted for
  M1–M2; revisit before M3 (requirements §5.3).
- RLS mistakes are invisible in the UI. The two-account manual check (F-10) is
  required before making anything public.
