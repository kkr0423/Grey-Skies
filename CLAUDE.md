@AGENTS.md

# Grey Skies Looks — Requirements

Condensed from `../Grey Skies Requirements/` (`requirements.md` v0.4, `grey-skies-overview.md`, `schema.sql`). Those files are the source of truth; update them first if a requirement changes.

## Product

- A personal archive of outfit photos ("looks"), fitting the Grey Skies brand: Hedi Slimane's view of London culture; overcast, monochrome, thin lines.
- Must work for a single user. Public sharing is added later as something that can be switched on.
- The one metric that matters: of first-time posters, the share who post a second time. Followers, PV and likes are not used for decisions.

## Scope (work in order; don't start a milestone before the previous one is done)

- **M1 (current):** F-01 email+password signup/login with email confirmation; F-02 `profiles` row on first login; F-03 post a look (one image + worn-on date + optional caption); F-04 `/archive` of own looks; F-05 logout; F-06 Vercel deploy. Tables: `profiles`, `looks`, `look_images`.
- **M2:** F-07 multiple images (1–5 per look); F-08 edit/delete (owner only); F-09 resized image delivery; F-10 manual RLS check with two accounts (mandatory); F-11 motion.
- **M3:** F-12 per-look public/private (default **private**); F-13 public look detail page (SSR/ISR); F-14 public feed (newest first); F-15 reports (emailed to operator); F-16 terms and privacy policy; F-17 error monitoring (Sentry etc.). UGC prerequisites: age-limit policy, takedown rights in the terms, handling of third parties in photos.
- **M4+ (not now):** hype/likes, tags, public profiles, OGP/sitemap, follow/comments/notifications/DM, native apps.
- **Out of scope:** payments, i18n, affiliate links, admin UI (use the Supabase console).

## Motion

- **No animation or GSAP in M1.** Motion is M2 (F-11), using `gsap` + `@gsap/react` (`useGSAP`, `registerPlugin` once at top level, `"use client"` for animated components). Do not use ScrollSmoother, MorphSVG, CustomBounce or CustomWiggle.
- Character: "appear, never bounce". No bounce, elastic, overshoot, big rotations, 3D or heavy parallax. When unsure, use less motion.
- Starting tokens (tunable): ease `power3.out` / exit `power2.in`; micro 0.2s, base 0.6s, entrance 0.9s; stagger 0.06s; shift-y 16px.
- Animate only `transform` and `opacity`.
- Hard constraints: honor `prefers-reduced-motion` (show the final state immediately); never animate the LCP element; no layout shift; scroll-triggered reveals play once (`once: true`); set the initial hidden state only under a JS-enabled class on `<html>`; no animation on skeletons.

## Non-functional

- Performance: LCP ≤ 2.5s (mobile 4G), CLS ≤ 0.1 (always set image `width`/`height`). Never serve originals as thumbnails; use Cloudinary transforms, AVIF/WebP, `srcset` + `sizes`. Speed beats motion when they conflict.
- Cost: images on Cloudinary via CDN; Supabase Spend Cap enabled.
- Security: RLS is the only access barrier and enabled on every table. RLS mistakes are invisible in the UI, so verify manually with two accounts. The Cloudinary API secret stays server-side; uploads go through a server action only; images are stored as `type: authenticated` and delivered via signed URLs. Known limit: `sign_url` URLs never expire (revisit before M3).
- Accessibility: reduced-motion support, alt text on images (caption may be reused), visible keyboard focus.
- SEO: minimal. Public look pages use SSR/ISR (M3); logged-in screens may be CSR.
- Ops: backups verified, error monitoring in M3, no SLA.

## Data model

- Images live in a separate `look_images` table (variable count), never as columns on `looks`.
- Store Cloudinary `public_id` (plus `version`, `width`, `height`), never full URLs.
- `hype_count` is denormalized and trigger-maintained (M4).
- Later tables: `reports` (M3); `hypes`, `tags`, `look_tags` (M4).

## Posting guidelines

- Include: London culture, monochrome tones, stripped-back silhouettes, people and places.
- Exclude: colourful, decorative, bright-toned, or non-London subjects.

## Open questions

Expiring image links; age-limit policy; concrete motion expression; criteria for starting M2.
