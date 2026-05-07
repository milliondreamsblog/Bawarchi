---
name: design-system
description: Use when building or modifying any UI in this repo — pages, components, modals, forms. Defines the brand palette, component conventions, typography, and what NOT to do. Trigger on any styling task or when user mentions "design", "UI", "look", "redesign".
---

# Bawarchie Design System

## Palette (use these — do not introduce new brand hues)

| Token | Hex | Tailwind class | Usage |
|---|---|---|---|
| Navy | `#324F7B` | `bg-[#324F7B]` | Hero, primary CTA, dark surfaces, headings on light |
| Blue | `#5067AA` | `bg-[#5067AA]` | Hover state, secondary CTA, links |
| Sky | `#86A6DE` | `bg-[#86A6DE]` | Active chips, focus rings, accent on dark surfaces |
| Off-white | `#F8F8F8` | `bg-[#F8F8F8]` | Page background |
| White | `#FFFFFF` | `bg-white` | Cards |

Hover-darken for navy: `#283f63`.

## Semantic colors (keep as Tailwind, do not brand-shift)

- **Veg / success**: `emerald-*`
- **Non-veg / error / danger**: `red-*`
- **Warning / star ratings**: `amber-*`
- **Neutral text/borders**: `stone-*` (700 for body, 500 for muted, 200 for borders, 50 for subtle backgrounds)

## Typography

- Restaurant names, section titles: `font-serif italic` for elegance
- Body: default sans-serif (system stack)
- Eyebrow labels (small uppercase tags): `text-[10px] tracking-[0.2em] uppercase`
- Numbers (prices, totals): `tabular-nums` so columns align

## Components

### Button — primary
```tsx
<button className="bg-[#324F7B] hover:bg-[#283f63] text-white px-6 py-2.5 rounded-full font-medium text-sm transition-colors">
  Action
</button>
```

### Button — accent on dark surface
```tsx
<button className="bg-[#86A6DE] hover:bg-white text-[#324F7B] px-5 py-3 rounded-full font-semibold text-sm shadow-lg transition-colors">
  Action
</button>
```

### Card
```tsx
<div className="bg-white rounded-2xl border border-stone-200 p-4 hover:shadow-[0_8px_30px_rgba(50,79,123,0.10)] transition-all">
  ...
</div>
```

### Pill / chip
```tsx
<button className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
  active
    ? "bg-[#324F7B] text-white border-[#324F7B]"
    : "bg-white text-stone-700 border-stone-200 hover:border-[#86A6DE]"
}`}>
  Label
</button>
```

### Hero / dark surface
```tsx
<header className="bg-[#324F7B] text-white relative overflow-hidden">
  <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(circle_at_1px_1px,_white_1px,_transparent_0)] [background-size:24px_24px]" />
  <div className="relative px-5 py-8">
    <p className="text-[10px] tracking-[0.3em] text-[#86A6DE] uppercase">Eyebrow</p>
    <h1 className="text-3xl font-serif italic">Title</h1>
  </div>
</header>
```

### Form input
```tsx
<input className="w-full bg-white text-stone-900 placeholder:text-stone-400 rounded-full px-4 py-3 text-sm border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#86A6DE]" />
```

### Veg/non-veg indicator
Use a small bordered square with a centered dot — emerald for veg/vegan, red for non-veg. See `components/ItemCard.tsx` for reference.

## Spacing & shape rhythm

- Card corners: `rounded-2xl` (default) or `rounded-3xl` (large hero / receipts)
- Buttons / chips: `rounded-full`
- Inputs: `rounded-full` for search, `rounded-2xl` for textareas
- Generous padding: `px-5` to `px-8` on containers, `py-3` to `py-5` on sections
- Gap rhythm: `gap-2`, `gap-3`, `gap-4`, `gap-6` — avoid odd values

## What NOT to do

- ❌ Don't use the green/teal palette from old code (`bg-green-600`, `bg-emerald-600` for brand) — it's been replaced.
- ❌ Don't use `bg-gradient-to-*` heavily. The new look is flat and confident.
- ❌ Don't sprinkle emojis as primary UI affordances. Keep them tasteful (filter chips OK, action buttons not OK).
- ❌ Don't add new brand colors. If you need an accent, it's `#86A6DE` or `#5067AA`.
- ❌ Don't use `border-2` everywhere — `border` (1px) is the default; thicker borders are for emphasis.
- ❌ Don't use `shadow-2xl` on small cards — soft custom shadow `shadow-[0_8px_30px_rgba(50,79,123,0.10)]` reads more premium.

## Reference implementations

- `app/r/[restaurantSlug]/t/[tableSlug]/page.tsx` — full hero + sticky filter + sections + sticky cart pattern
- `components/ItemCard.tsx` — card with image, dietary chips, price+CTA
- `components/Cart.tsx` — line items + billing breakdown
- `app/order-success/order-success.tsx` — receipt + status timeline + feedback
- `app/admin/[slug]/layout.tsx` — icon-rail sidebar (collapsed 64px, expands to 224px on hover) + sticky header
- `app/admin/[slug]/page.tsx` — operational dashboard: live stat cards + pending preview + quick actions
- `app/admin/[slug]/orders/page.tsx` — one-tap status advancement with optimistic updates + auto-refresh
- `app/admin/[slug]/items/page.tsx` — grid + side drawer for create/edit + auto-save availability toggle

## Admin panel — operational UX rules

These pages are used by stressed staff during service. Design accordingly:

- **Compact density** over generous whitespace. Restaurant staff glance for 2 seconds at a time.
- **One tap to advance** — the primary action on each row should require zero confirmations for non-destructive flows. Use optimistic UI; revert on error.
- **Auto-save** wherever safe: toggling availability, stock count on blur, simple flag fields. Show a short visual confirmation (state change is enough; don't pop modals).
- **Confirm only destructive** actions (delete, refund). Use `confirm()` — keep it simple, no library.
- **Live data**: poll every 5–15s OR use SSE (`/api/orders/stream`) for kitchen-critical screens. Show a subtle "Live" indicator.
- **Status pills** with colored dots are faster to scan than icons.
- **Sticky filter bars** beat top-of-page filters that scroll away.
- **Side drawer** beats full-page form for editing — preserves context, cancellable with a click outside.
- **No emojis as load-bearing UI** — they read as childish under pressure. Use them only for taste markers (spice levels, dietary).
- **Urgency colors**: green/blue for fresh, amber for warning (>5 min), red ring/border for critical (>10 min).
- **Keep buttons fingertip-sized** (min 36px tall) since staff use phones with greasy fingers.
