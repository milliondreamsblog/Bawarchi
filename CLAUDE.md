# Bawarchie — Agent Guide

Multi-tenant QR-based restaurant ordering SaaS. Customers scan a table QR → menu → AI waiter → cart → Razorpay checkout → live order tracking. Restaurant admins manage menu/items/tables/orders/inventory/feedback. Super admin approves restaurants.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript** + **Tailwind CSS 4**
- **MongoDB** via Mongoose 8
- **NextAuth 5** (Credentials provider, JWT sessions)
- **OpenAI GPT-4o-mini** (AI waiter, sentiment analysis)
- **Razorpay** (payments + refunds)
- **Cloudinary** (item images, QR codes)
- **Zustand** (cart state with persist)
- **Web Push** (PWA notifications via VAPID)

## Repo layout

```
app/
  api/                          # All route handlers (33 routes)
    auth/[...nextauth]/         # NextAuth handler (delegates to lib/auth.ts)
    auth/signup/                # Restaurant registration (status=pending)
    auth/restaurants/           # Super admin approval
    menu/, items/, tables/      # Restaurant admin CRUD
    orders/, orders/stream/     # Order lifecycle + SSE feed
    payments/                   # Razorpay create-order + verify
    feedback/, ai/              # Reviews + GPT integration
    analytics/, super-admin/    # Aggregations
    push/                       # PWA push subscriptions
    setup/                      # One-time seed
  r/[restaurantSlug]/t/[tableSlug]/  # Customer QR landing
  admin/[slug]/                 # Restaurant dashboard (menu/items/tables/orders/kitchen/inventory/feedback/analytics/settings)
  super-admin/                  # Platform admin
  auth/, order-success/, chat/

components/                     # ItemCard, Cart, RazorpayCheckout, MenuAIChat, admin/*
lib/
  auth.ts                       # NextAuth config — super-admin check + restaurant credential check
  db.js                         # Mongoose connection (cached)
  models/                       # Restaurant, Item, Order, Table, Feedback, PushSubscription
  store/useCartStore.ts         # Zustand cart with billing breakdown
  utils/                        # password (bcrypt), slug, etc.
.env                            # Secrets (gitignored — never commit)
```

## Roles & Auth

Two roles only: `super-admin` and `restaurant`. Customers don't have accounts.

- **Super admin**: env-based, no DB record. Hardcoded check in `lib/auth.ts:20-33`. Reads `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` env vars.
- **Restaurant**: stored in `restaurants` collection. Status enum: `pending` / `approved` / `blocked`. Login fails if not approved (`lib/auth.ts:56-58`).
- **Customer**: visits `/r/[restaurantSlug]/t/[tableSlug]` directly via QR — no auth.

JWT session shape: `{ id, role, slug?, email, name }`. Use `auth()` from `lib/auth.ts` server-side; use `useSession()` client-side.

## Multi-tenant pattern

Every restaurant-scoped resource has `restaurantId: ObjectId` on its model. **Always filter by `restaurantId`** in queries — no exceptions, or you'll leak data across tenants.

URLs use slugs (human-readable) for customer-facing routes and `_id` for admin/API. The `Restaurant` model has both `slug` (unique) and `_id`. Look up by slug → resolve to `_id` → query.

## Design System

**Primary palette** (use these site-wide; do not introduce new brand hues):

| Token | Hex | Usage |
|---|---|---|
| Navy (primary dark) | `#324F7B` | Hero, primary buttons, headings on light bg |
| Blue (primary mid) | `#5067AA` | Hover, secondary CTAs, links |
| Sky (accent) | `#86A6DE` | Active chips, focus rings, soft accents |
| Off-white (surface) | `#F8F8F8` | Page background |
| White | `#FFFFFF` | Card surfaces |

**Semantic colors** (don't replace with brand):
- Success/veg: `emerald-*`
- Error/non-veg/danger: `red-*`
- Warning: `amber-*` (also used for star ratings)
- Neutrals: `stone-*` for text/borders

**Tailwind usage:** prefer arbitrary values for the brand hex codes (`bg-[#324F7B]`, `text-[#86A6DE]`). Stone scale is fine for neutrals.

**Component conventions:**
- Buttons: `rounded-full`, navy bg with white text for primary, sky-blue accent for inverse-on-dark
- Cards: `rounded-2xl` or `rounded-3xl`, white bg, `border-stone-200`
- Hero/dark sections: `bg-[#324F7B]` with `text-white` body and `text-[#86A6DE]` for eyebrow labels
- Pills/chips: `rounded-full`, navy when active, white-with-stone-border when inactive
- Typography: `font-serif italic` for restaurant names and section titles, sans-serif for body
- Spacing: generous; let things breathe

## Common commands

```powershell
npm run dev              # next dev (binds 0.0.0.0 for LAN access — phones on same WiFi can scan QR)
npm run build            # production build
npm run lint             # eslint
npm run seed             # node scripts/seed.mjs (seed test data)
```

LAN testing: `NEXT_PUBLIC_BASE_URL` and `NEXTAUTH_URL` in `.env` should point to the dev machine's LAN IP (e.g., `http://192.168.1.2:3000`) for QR scanning to work from a phone.

## Default credentials (dev only)

- **Super admin**: env-based. Default `papa@Bawarchie.com` / `papa123` (change before deploy).
- **Default restaurant**: `default@restaurant.com` / `defaultpass123` (created by `POST /api/setup`).

## Patterns to follow

**API routes:** export named methods (`GET`, `POST`, etc.). Connect DB at top via `await connectDB()`. Return `NextResponse.json({ success, ... })` — the codebase uses a consistent `{ success: boolean, ... }` envelope. Read role from `auth()` for protected routes.

**Mongoose models:** use `.lean()` when returning to client. Cast `_id` with `.toString()` when comparing strings. Always index `restaurantId` on tenant-scoped collections.

**Client data fetching:** plain `fetch` with `useEffect` is the most common pattern. SWR is used in `app/admin/[slug]/orders/page.tsx` for auto-refreshing the order queue. Pick whichever fits — SWR for live polling lists, plain fetch for one-shot loads. Handle `data.success === false` as error.

**Forms:** controlled components, simple `useState`. No form library.

**Cart:** `useCartStore` (Zustand persist). Always call `useCartStore.persist.rehydrate()` in a `useEffect` before reading cart on client (hydration race). Use `getBillingBreakdown()` for GST + 2% platform fee math — do not recompute manually.

**Razorpay:** order creation in `/api/payments/create-order`, signature verification in `/api/payments/verify` (HMAC-SHA256 — never skip).

## Things NOT to do

- Don't query collections without `restaurantId` filter (cross-tenant leak)
- Don't add `NEXT_PUBLIC_*` env vars for secrets — they ship to the browser bundle
- Don't introduce new brand colors outside the palette above
- Don't create new auth roles — two-role model is intentional
- Don't bypass the approval gate on login (`status !== "approved"` must throw)
- Don't compute totals client-side and trust them server-side — `/api/orders` recalculates from item IDs
- Don't commit `.env` (gitignored — keep it that way)

## Useful starting points when extending

| Task | Start here |
|---|---|
| New API route | Copy structure from `app/api/items/route.ts` (auth-protected) or `app/api/menu/route.ts` (mixed) |
| New admin page | Copy layout from `app/admin/[slug]/items/page.tsx` |
| New customer feature | Edit `app/r/[restaurantSlug]/t/[tableSlug]/page.tsx` |
| New Mongoose model | Copy `lib/models/Item.js`, register in any route via import |
| New AI feature | Pattern in `app/api/ai/chat/route.ts` and `app/api/feedback/route.ts` (sentiment) |
