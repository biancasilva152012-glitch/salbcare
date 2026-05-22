# SalbCare Multi-Product Refactor Plan

This is a large, multi-phase architectural change. I want to confirm scope and sequencing before touching code, because several phases carry real regression risk for the live SaaS at salbcare.com.

## Risk assessment of the brief

A few items in the spec will break things if followed literally. I'll flag them and propose safe alternatives:

1. **Moving current `/` to `/pro`** — The existing root (`Index.tsx`) is the live SaaS landing, indexed by Google, linked from ads, WhatsApp, partner pages, and SEO memory says canonical is `salbcare.com/`. Replacing it with a brand hub will tank conversions and SEO overnight. **Recommendation**: build the hub at `/hub` (or behind a feature flag) first, validate, then swap. Or: keep `/` as Pro and put the hub at `/welcome`.

2. **Supabase `kite` schema** — The project already has a working `/kite` flow using `public.kite_bookings` + `create-kite-checkout` + `kite-webhook` + R$50 Stripe price (`price_1TZAulBUEEEAHx2hykS14Xnf`). Creating a parallel `kite.bookings` schema duplicates working infra. **Recommendation**: skip Phase 6/7 entirely — the Kite backend is already done and tested. Add the `procedures` catalog table in `public` only if we actually need it.

3. **`/api/webhooks/stripe-kite`** — This is Next.js syntax. Project is Vite + Supabase Edge Functions. The existing `kite-webhook` edge function already does exactly what Phase 7 describes, with its own `STRIPE_WEBHOOK_SECRET_KITE`. **Recommendation**: nothing to do here.

4. **Routes `/login`, `/signup`, `/dashboard`** — Spec says don't touch. Project uses `/login`, `/register` (not `/signup`), `/dashboard`. Already safe.

5. **Design tokens file at `src/styles/tokens.ts`** — Project's design system lives in `src/index.css` + `tailwind.config.ts` as HSL semantic tokens (per Lovable rules). A parallel JS tokens object fragments the system. **Recommendation**: add the new brand/pro/kite colors as HSL CSS variables in `index.css` and Tailwind config, not as a JS export.

## Proposed execution (safe path)

### Phase A — Routing + Hub (no Pro regression)
- Keep `/` = current SaaS landing (Index.tsx) **unchanged**
- Add new route `/hub` rendering the new brand hub
- Add `/pro` as an alias of current `/` (same component) so future links work
- Add `/about` and `/contact` (simple new pages)
- Once we validate analytics, we can swap `/` ↔ `/hub` in a separate one-line PR

### Phase B — Shared components
- `src/components/shared/BrandLogo.tsx`
- `src/components/shared/SharedFooter.tsx`
- `src/components/shared/LanguageSwitcher.tsx`
- Used on `/hub`, `/about`, `/contact` only. Pro and Kite keep current chrome.

### Phase C — Design tokens (Lovable-correct way)
- Add `--brand-dark`, `--pro-accent`, `--kite-gold`, etc. as HSL variables in `src/index.css`
- Extend `tailwind.config.ts` to expose them as `bg-pro-accent`, `bg-kite-gold`, etc.
- Use them on hub/about/contact. Don't refactor Pro or Kite.

### Phase D — Hub content
- Hero (full-height, deep teal)
- Two product cards with language-based ordering (`navigator.language` + `localStorage.salbcare_lang`)
- Brand story paragraph
- Shared footer

### Phase E — SEO
- `<Helmet>` per new route with the titles/descriptions specified
- Add `/hub`, `/about`, `/contact`, `/pro` to `public/sitemap.xml`

### Phase F — Analytics
- Extend existing `useTracking` hook to push `vertical` dimension (`pro` | `kite` | `hub`) per pageview

### Skipped (intentionally)
- Phase 6 Supabase `kite` schema — duplicates working `public.kite_bookings`
- Phase 7 new Stripe webhook — `kite-webhook` already exists and works
- Refactoring existing Pro pages to consume new tokens (spec also says skip)

## Questions before I start

1. **Root route**: OK to ship hub at `/hub` first and keep `/` as the current Pro landing? Or do you want `/` swapped immediately and accept the SEO/conversion risk?
2. **Skip Phase 6/7?** Confirm we don't rebuild the Kite Supabase/Stripe layer that's already live.
3. **Tokens as CSS HSL vars** instead of `src/styles/tokens.ts`? (Required by Lovable design-system rules.)

Once you answer those three, I'll execute Phases A–F in one pass.
