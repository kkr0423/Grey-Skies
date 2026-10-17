# Grey Skies — Looks

Phase 2 of Grey Skies: a personal archive of looks
(Next.js + Supabase + Cloudinary + Vercel).

Spec lives in `../Grey Skies Requirements/` (`requirements.md`,
`grey-skies-overview.md`, `schema.sql`). This repo implements **M1**.

The UI is styled with Tailwind (overcast grey palette, Bricolage Grotesque,
light/dark via `prefers-color-scheme`; tokens live in `src/app/globals.css`).
There is no animation yet: GSAP and motion are deferred to M2.

## M1 scope

| #    | Feature                                                                       |
| ---- | ----------------------------------------------------------------------------- |
| F-01 | Email + password signup/login, email confirmation required                    |
| F-02 | `profiles` row created on first login                                         |
| F-03 | Post a look: one image + worn-on date + optional caption (private by default) |
| F-04 | `/archive`: your own looks                                                    |
| F-05 | Log out                                                                       |
| F-06 | Deploy to Vercel                                                              |

Tables used: `profiles`, `looks`, `look_images` (`supabase/schema.sql` is the
full spec schema, including M3/M4 tables).

Images go to Cloudinary through a server action as `type: authenticated`.
Only `public_id` / `version` / `width` / `height` are stored; delivery URLs
are signed and built at render time (`src/lib/images.ts`) with `f_auto,q_auto`
and `srcset`, so thumbnails never receive the original.

## Setup

1. Create a Supabase project and run `supabase/schema.sql` in the SQL Editor.
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
