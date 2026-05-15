# Bawarchie — Agent Guide

Multi-tenant QR-based restaurant ordering SaaS. Customers scan a table QR → menu → AI waiter → cart → Razorpay checkout → live order tracking. Restaurant admins manage menu/items/tables/orders/inventory/feedback. Super admin approves restaurants.

The repo is a **pnpm + Turborepo monorepo** with one Next.js web app and two Expo native apps. Shared TypeScript types live in `packages/types`.

## Stack

- **Web** (`apps/web`): Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS 4
- **Restaurant native app** (`apps/restaurant`): Expo SDK 54 + Expo Router + React Native 0.81 — staff order queue / push notifications (in progress)
- **Customer native app** (`apps/customer`): Expo SDK 54 + Expo Router — opt-in social/loyalty layer on top of the anonymous QR flow (in progress)
- **MongoDB** via Mongoose 8
- **NextAuth 5** (Credentials provider, JWT sessions)
- **OpenAI GPT-4o-mini** (AI waiter, sentiment analysis)
- **Razorpay** (payments + refunds)
- **Cloudinary** (item images, QR codes)
- **Zustand** (cart state with persist)
- **Web Push** (PWA notifications via VAPID)

## Repo layout

```
apps/
  web/                            # Next.js 16 app — the API surface + browser experience
    app/
      api/                        # All route handlers (33 routes)
        auth/[...nextauth]/       # NextAuth handler (delegates to lib/auth.ts)
        auth/signup/              # Restaurant registration (status=pending)
        auth/restaurants/         # Super admin approval
        menu/, items/, tables/    # Restaurant admin CRUD
        orders/, orders/stream/   # Order lifecycle + SSE feed
        payments/                 # Razorpay create-order + verify
        feedback/, ai/            # Reviews + GPT integration
        analytics/, super-admin/  # Aggregations
        push/                     # PWA push subscriptions
        setup/                    # One-time seed
      r/[restaurantSlug]/t/[tableSlug]/  # Customer QR landing
      admin/[slug]/               # Restaurant dashboard
      super-admin/, auth/, order-success/, chat/
    components/                   # ItemCard, Cart, RazorpayCheckout, MenuAIChat, admin/*, landing/*
    lib/
      auth.ts                     # NextAuth config — super-admin check + restaurant credential check
      db.js                       # Mongoose connection (cached)
      models/                     # Restaurant, Item, Order, Table, Feedback, Diner, PushSubscription
      store/useCartStore.ts       # Zustand cart with billing breakdown
      utils/                      # password (bcrypt), slug, etc.
    scripts/                      # seed.mjs, seed-demo.mjs, probe-all.mjs, etc.
    .env                          # Web-app secrets (gitignored — never commit)
    next.config.ts                # turbopack.root set to monorepo root

  restaurant/                     # Expo app — staff
    app/(tabs)/                   # Expo Router file-based routing
    .env.local                    # EXPO_PUBLIC_API_URL (gitignored)

  customer/                       # Expo app — diners (opt-in)
    app/(tabs)/
    .env.local

packages/
  tsconfig/                       # Shared TS base + nextjs preset
    base.json
    nextjs.json                   # adds the next plugin
  types/                          # Shared cross-app types
    src/index.ts                  # ApiResponse<T>, OrderStatus, …

package.json                      # workspace root — turbo orchestrates
pnpm-workspace.yaml
turbo.json
```

## Roles & Auth

Two roles only (in the current web app): `super-admin` and `restaurant`. Customers don't have web accounts; the customer Expo app will introduce an **opt-in registered diner identity** that strengthens the cross-restaurant taste graph (see `report.md` ch. 6).

- **Super admin**: env-based, no DB record. Hardcoded check in `apps/web/lib/auth.ts:20-33`. Reads `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` env vars.
- **Restaurant**: stored in `restaurants` collection. Status enum: `pending` / `approved` / `blocked`. Login fails if not approved (`apps/web/lib/auth.ts:56-58`).
- **Customer (anonymous web)**: visits `/r/[restaurantSlug]/t/[tableSlug]` directly via QR — no auth, anonymous device cookie.
- **Customer (registered, native app)**: future — opt-in account, ties device cookie → real identity.

JWT session shape: `{ id, role, slug?, email, name }`. Use `auth()` from `apps/web/lib/auth.ts` server-side; use `useSession()` client-side.

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

The palette applies to the native apps too. Use the same hex codes in React Native `style` props or via a small theme constants module — do not reinvent.

**Component conventions (web):**
- Buttons: `rounded-full`, navy bg with white text for primary, sky-blue accent for inverse-on-dark
- Cards: `rounded-2xl` or `rounded-3xl`, white bg, `border-stone-200`
- Hero/dark sections: `bg-[#324F7B]` with `text-white` body and `text-[#86A6DE]` for eyebrow labels
- Pills/chips: `rounded-full`, navy when active, white-with-stone-border when inactive
- Typography: `font-serif italic` for restaurant names and section titles, sans-serif for body
- Spacing: generous; let things breathe

## Common commands

Run from the **repo root** with pnpm (npm/yarn won't resolve workspace deps correctly):

```powershell
pnpm install             # install everything across the workspace
pnpm dev:web             # boot only the Next.js web app on :3000
pnpm --filter @bawarchie/restaurant start   # boot the restaurant Expo dev server
pnpm --filter @bawarchie/customer start     # boot the customer Expo dev server
pnpm build               # turbo run build (all apps)
pnpm lint                # turbo run lint
pnpm typecheck           # turbo run typecheck
pnpm seed                # seed test data via apps/web/scripts/seed.mjs
pnpm seed:demo           # cross-restaurant demo seed
pnpm probe               # regression probes
```

LAN testing: `NEXT_PUBLIC_BASE_URL` and `NEXTAUTH_URL` in `apps/web/.env` should point to the dev machine's LAN IP (e.g., `http://192.168.1.2:3000`). Mirror that same IP into `EXPO_PUBLIC_API_URL` in each Expo app's `.env.local` so phones on the same WiFi can reach the web API.

## Default credentials (dev only)

- **Super admin**: env-based. Default `papa@Bawarchie.com` / `papa123` (change before deploy).
- **Default restaurant**: `default@restaurant.com` / `defaultpass123` (created by `POST /api/setup`).

## Patterns to follow

**API routes:** export named methods (`GET`, `POST`, etc.). Connect DB at top via `await connectDB()`. Return `NextResponse.json<ApiResponse<...>>({ success, ... })` — the envelope type lives in `@bawarchie/types`. Read role from `auth()` for protected routes.

**Mongoose models:** use `.lean()` when returning to client. Cast `_id` with `.toString()` when comparing strings. Always index `restaurantId` on tenant-scoped collections.

**Client data fetching (web):** plain `fetch` with `useEffect` is the most common pattern. SWR is used in `apps/web/app/admin/[slug]/orders/page.tsx` for auto-refreshing the order queue. Handle `data.success === false` as error.

**Client data fetching (native):** call `process.env.EXPO_PUBLIC_API_URL` + path. The response envelope is the same `ApiResponse<T>` from `@bawarchie/types`, so the narrow on `data.success` works identically.

**Forms:** controlled components, simple `useState`. No form library.

**Cart:** `useCartStore` (Zustand persist). Always call `useCartStore.persist.rehydrate()` in a `useEffect` before reading cart on client (hydration race). Use `getBillingBreakdown()` for GST + 2% platform fee math — do not recompute manually.

**Razorpay:** order creation in `/api/payments/create-order`, signature verification in `/api/payments/verify` (HMAC-SHA256 — never skip).

**Shared types:** when adding a type that more than one app will consume, put it in `packages/types/src/` and import via `@bawarchie/types`. Don't duplicate Mongoose lean shapes across apps.

## Things NOT to do

- Don't query collections without `restaurantId` filter (cross-tenant leak)
- Don't add `NEXT_PUBLIC_*` or `EXPO_PUBLIC_*` env vars for secrets — they ship in the JS bundle
- Don't introduce new brand colors outside the palette above
- Don't create new auth roles for the web app — the two-role model is intentional. The forthcoming customer-app registered identity is a separate `Diner` model, not a new web auth role.
- Don't bypass the approval gate on login (`status !== "approved"` must throw)
- Don't compute totals client-side and trust them server-side — `/api/orders` recalculates from item IDs
- Don't commit `.env` or `.env.local` (gitignored — keep it that way)
- Don't use `npm` or `yarn` — this is a pnpm workspace
- Don't run `next dev` directly from `apps/web/`; use `pnpm dev:web` from root so turbo's task graph picks up cross-package changes

## Useful starting points when extending

| Task | Start here |
|---|---|
| New API route | Copy structure from `apps/web/app/api/items/route.ts` (typed envelope) or `apps/web/app/api/menu/route.ts` |
| New admin page | Copy layout from `apps/web/app/admin/[slug]/items/page.tsx` |
| New web customer feature | Edit `apps/web/app/r/[restaurantSlug]/t/[tableSlug]/page.tsx` |
| New Mongoose model | Copy `apps/web/lib/models/Item.js`, register via import |
| New AI feature | Pattern in `apps/web/app/api/ai/chat/route.ts` and `apps/web/app/api/feedback/route.ts` (sentiment) |
| New native screen (restaurant) | Add a tab in `apps/restaurant/app/(tabs)/` |
| New native screen (customer) | Add a tab in `apps/customer/app/(tabs)/` |
| New shared type | Add to `packages/types/src/index.ts`, import via `@bawarchie/types` |
