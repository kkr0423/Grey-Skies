@AGENTS.md

# Grey Skies — Requirements

Condensed from `../Grey Skies Requirements/` (`grey-skies-overview.md` v0.5, `requirements.md` v0.4, `schema.sql` v0.4). Those files are the source of truth; update them first if a requirement changes.

## Brand

- Lens: London culture seen through Hedi Slimane's eyes. Visual keywords: overcast, monochrome, thin lines.
- The lens decides what to leave out. Include: London culture (clothes, music, venues, the people around them), monochrome, stripped-back silhouettes, people and places rather than clothes alone. Exclude: colourful, decorative, bright-toned content, trend round-ups, e-commerce catalogue content, generic explainers that don't go through the lens.
- How wide the subject range is (Slimane's London / London culture in general / UK fashion in general) is still open. The middle tier is the default.
- The same exclusion rules apply to choosing journal topics and to the Looks posting guidelines.

## Structure

One Next.js (App Router) codebase on one domain, split by route. **Build the two phases one after the other, never at the same time.**

| Route | Product |
|---|---|
| `/` | Phase 1: Journal (articles) |
| `/journal/*` | Individual articles |
| `/looks` | Phase 2: Grey Skies Looks (shows "coming soon" for now) |

- Build the journal first. Readers who share the brand's taste become the first Looks posters.
- Work out the right motion in the journal. Looks reuses the same shared tokens, so nothing has to be ported.
- Design, motion and components are shared across both phases.

## Phase 1: Journal

- Built from scratch with Next.js and Markdown, deployed on Vercel. No CMS, no database, no admin UI, no newsletter (add Substack or Beehiiv later if needed).
- Articles are written in **English**.
- Layout: `content/journal/YYYY-MM-DD-slug.md`, images in `content/images/`.
- Frontmatter: `title`, `slug`, `date`, `hero`, `og_description`, `draft`. Articles with `draft: true` are left out of the build. Setting `draft: false` and committing publishes the article, and Vercel deploys it automatically.
- Writing setup: the owner is editor-in-chief (picks topics, approves pieces, owns the final voice). Claude does research, outlines, drafts, English proofreading and fact-checking support. Every brief gives Claude three things: the lens (with the exclusion rules), a style sample (the latest final draft; skipped for the first article), and the point the article is making.
- Flow: Claude researches and proposes 3 topic candidates, the owner picks one, Claude drafts it, the owner reviews and publishes.
- Checks before publishing: facts (designer, brand, year and collection attributions), fit with the lens, voice, and an AI-use disclosure on the About page.
- Traffic comes from social media and shared links, not search. Keep SEO minimal but put effort into OGP images.
- Footer: `Grey Skies Looks — coming soon` with an email signup. The number of signups decides whether Looks gets built.

## Phase 2: Grey Skies Looks

- A personal archive of outfit photos ("looks"). It must work for a single user; public sharing is added later as something that can be switched on.
- The one metric that matters: of first-time posters, the share who post a second time. Followers, PV and likes are not used for decisions.
- Stack: Supabase (Postgres + Auth), Cloudinary (uploads through server actions only), Vercel, Sentry or similar (M3). No-code tools are not used.

### Scope (work in order; don't start a milestone before the previous one is done)

- **M1:** F-01 email+password signup/login with email confirmation; F-02 `profiles` row on first login; F-03 post a look (one image + worn-on date + optional caption); F-04 `/archive` of own looks; F-05 logout; F-06 Vercel deploy. Tables: `profiles`, `looks`, `look_images`. Plain UI, **no motion, no GSAP**.
- **M2 (after Phase 1):** F-07 multiple images (1–5 per look); F-08 edit/delete (owner only); F-09 resized image delivery; F-10 manual RLS check with two accounts (mandatory); F-11 motion (apply the journal's motion definitions).
- **M3 (public):** F-12 per-look public/private (default **private**); F-13 public look detail page, viewable logged out (SSR/ISR); F-14 public feed (newest first); F-15 reports (emailed to operator); F-16 terms and privacy policy; F-17 error monitoring. UGC prerequisites: terms and privacy policy published, a way to report looks, takedown rights in the terms, an age-limit policy (e.g. no under-13s), a policy for third parties in photos and unauthorised posts.
- **M4+ (not now):** hype/likes and popularity feed, tags and tag search, public profiles, OGP/sitemap/structured data, follow/comments/notifications/DM, native apps.
- **Out of scope:** payments, i18n, affiliate links, admin UI (use the Supabase console).

### Data model

- `profiles` (1:1 with `auth.users`; `username`, `display_name`, `bio`, `avatar_id`), `looks` (`caption`, `worn_on`, `is_public` default false, `hype_count`), `look_images` (`public_id`, `version`, `format`, `width`, `height`, `position`; M1 uses only `position = 0`). Later tables: `reports` (M3; `status` open/actioned/dismissed, clients can insert but not read), `hypes`, `tags`, `look_tags` (M4).
- Images live in a separate `look_images` table (variable count), never as columns on `looks`.
- Store Cloudinary `public_id` plus `version`, `width` and `height`, never full URLs.
- `hype_count` is denormalized and kept up to date by a `security definer` trigger (M4).
- Write RLS policies with `(select auth.uid())`, not a bare `auth.uid()`.

## Motion (GSAP)

- Used in the journal and in Looks from M2 (never in Looks M1). Libraries: `gsap` + `@gsap/react`. Plugins: ScrollTrigger (reveal on entering the viewport, `once: true`), SplitText (line reveals for headings and the brand name, used sparingly), Flip (grid-to-detail transition, M4+ idea). Do not use ScrollSmoother, MorphSVG, CustomBounce or CustomWiggle.
- Implementation: add `"use client"` to animated components, use `useGSAP()` for cleanup, call `gsap.registerPlugin()` once at the app's top level.
- Character: "appear, never bounce". No bounce, elastic, overshoot, big rotations, 3D or heavy parallax. Fades and very short vertical moves; motion that sets the order the eye reads in, not motion that grabs attention. When unsure, use less motion.
- Tokens are starting points and can be tuned. Define them once as shared CSS variables/constants:

| Token | Value | Use |
|---|---|---|
| `ease-standard` | `cubic-bezier(0.22, 1, 0.36, 1)` / `power3.out` | almost everything |
| `ease-exit` | `cubic-bezier(0.4, 0, 1, 1)` / `power2.in` | exits |
| `dur-micro` | 0.2s | hover, buttons |
| `dur-base` | 0.6s | element reveal |
| `dur-entrance` | 0.9s | first view of a page or section |
| `stagger` | 0.06s | lists and grids |
| `shift-y` | 16px | vertical offset on reveal |

- Where Looks uses it: archive grid cards reveal with `stagger`; on look detail the image fades in and the text rises by `shift-y`; page transitions are a short `dur-base` fade; buttons and links change on hover over `dur-micro`.
- Animate only `transform` and `opacity`.
- Hard constraints: honor `prefers-reduced-motion` (show the final state immediately, and test it by actually switching the OS setting); never animate the LCP element; no layout shift (reserve the element's space first); scroll-triggered reveals play once; set the initial hidden state only under a JS-enabled class on `<html>`; no animation on skeletons.

## Non-functional

- Performance: LCP ≤ 2.5s (mobile 4G), CLS ≤ 0.1 (always set image `width`/`height`). Never serve originals as thumbnails; use Cloudinary transforms, AVIF/WebP, `srcset` + `sizes`. Speed beats motion when they conflict.
- Cost: images on Cloudinary via CDN with transformed sizes cached; Supabase Spend Cap enabled.
- Security: RLS is the only access barrier and is enabled on every table. RLS mistakes are invisible in the UI, so verify manually with two accounts. The Cloudinary API secret stays server-side; uploads go through a server action only; images are stored as `type: authenticated` and delivered via signed URLs. Known limit: `sign_url` URLs never expire (revisit before M3).
- Accessibility: reduced-motion support, alt text on images (the caption may be reused), visible keyboard focus.
- SEO: minimal. Public look pages use SSR/ISR (M3); logged-in screens may be CSR; OGP for Looks is M4+.
- Ops: Supabase backups confirmed, error monitoring in M3, no SLA.

## Open questions

- Subject range (which of the three tiers); domain (secure both `grey` and `gray` spellings); notification channel; whether Claude commits articles directly or opens PRs; research cadence; whether a newsletter is needed.
- Expiring image links; age-limit policy; concrete motion expression; criteria for starting M2 (e.g. journal email signups).
