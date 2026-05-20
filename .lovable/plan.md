# Plan: /kite Landing Page for SalbDental

## Overview
English-language landing page targeting European kitesurfers in Ilha do Guajiru. Two payment models:
- **In-person** (Dental + Physio): R$50 booking fee via Stripe, rest paid at clinic
- **Online** (Telehealth): Full payment via Stripe

## Files to Create

### Frontend
1. **`src/pages/Kite.tsx`** — Main landing page (English, Playfair Display + DM Sans)
   - Fixed navbar (transparent → frosted on scroll)
   - Hero with green gradient (#1a3a2a → #2c6e49)
   - 3 tabs: Dental / Physio / Online
   - Procedure cards with price comparison (BR vs EU)
   - Booking modal (name, email, date, time preference, notes)
   - "How it works", testimonials, final CTA, footer
   - Captures `?ref=` query param → `localStorage.pousada_ref`

2. **`src/pages/KiteConfirmed.tsx`** — Post-payment confirmation
   - Reads `?session_id=` from URL
   - Fetches session details from edge function
   - Shows different message for presencial vs online
   - "Add to Google Calendar" CTA

3. **`src/components/kite/KiteBookingModal.tsx`** — Reusable booking modal
   - Form fields + Stripe checkout trigger
   - Color-coded badge (amber=in-person, green=online)

4. **`src/App.tsx`** — Register routes `/kite` and `/kite/confirmed` (public, no auth required)

### Backend (Edge Functions)
5. **`supabase/functions/create-kite-checkout/index.ts`** — Creates Stripe Checkout session
   - Accepts: `{ procedureId, type, patient_name, email, preferred_date, time_preference, notes, pousada_ref }`
   - Whitelist of allowed procedure IDs → price IDs and amounts
   - Returns Stripe checkout URL
   - No auth required (public booking)

6. **`supabase/functions/kite-webhook/index.ts`** — Stripe webhook handler
   - Handles `checkout.session.completed`
   - Inserts row into `kite_bookings`
   - Sends email to Bianca via Resend (using existing connector if available, otherwise skip email and just log)
   - `verify_jwt = false` in `supabase/config.toml`

7. **`supabase/functions/get-kite-session/index.ts`** — Fetch session details for confirmation page

### Database
8. **Migration**: Create `kite_bookings` table
   - Columns: id, procedure, type, patient_name, email, preferred_date, time_preference, notes, pousada_ref, stripe_session_id, amount_paid, remaining_balance, status, created_at
   - RLS: only admins can SELECT; service role inserts via webhook

### Stripe Products
Create 11 prices via `stripe--create_stripe_product_and_price`:
- 7× R$50 booking fee products (dental-cleaning, dental-whitening, dental-exam, physio-kite-recovery, physio-massage, physio-postural, physio-package)
- 4× telehealth products (psychology R$280, nutrition R$220, physio-online R$240, medicine R$200)
- Hardcode resulting price IDs in `create-kite-checkout` whitelist

## Stripe Webhook Configuration
After deploying, the user must add the webhook endpoint URL in Stripe Dashboard pointing to `kite-webhook` function and set `STRIPE_WEBHOOK_SECRET_KITE` secret. I'll add a note for this; reuse existing `STRIPE_WEBHOOK_SECRET` if available initially.

## Email Notification
Resend not currently connected — I'll structure the webhook to log notification details and prepare the email payload. If `RESEND_API_KEY` isn't set, it will skip sending (graceful). User can wire Resend later. All references use `salbcare.com`.

## Design Tokens
Page uses inline-scoped colors (#2c6e49, #1a1612, #f7f3ee) as it's a standalone marketing page with its own brand (SalbDental). This is intentional and self-contained — won't pollute the design system.

## Notes
- All URLs use `salbcare.com` (not `.com.br`)
- No commission logic — `pousada_ref` is analytics-only in metadata
- Mobile-first responsive
- Tabs use shadcn `Tabs` component
- Modal uses shadcn `Dialog`
