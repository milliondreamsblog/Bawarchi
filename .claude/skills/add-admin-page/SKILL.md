---
name: add-admin-page
description: Use when adding a new page under app/admin/[slug]/* — the restaurant owner dashboard. Covers slug-based tenant resolution, session checks, common layout, and data-fetching patterns. Trigger when user asks to add a new admin screen or extend the dashboard.
---

# Add admin page — repo patterns

Admin pages live under `app/admin/[slug]/` where `[slug]` is the restaurant slug. They run client-side and must:

1. Read `slug` from `useParams()`.
2. Resolve `slug` → restaurant `_id` via `/api/restaurant/by-slug/[slug]`.
3. Verify `useSession()` user owns this restaurant.
4. Fetch data scoped to `restaurantId`.

## Skeleton

```tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function NewAdminPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: session, status } = useSession();
  const router = useRouter();

  const [restaurant, setRestaurant] = useState<any>(null);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/login");
      return;
    }

    const load = async () => {
      const r = await fetch(`/api/restaurant/by-slug/${slug}`).then((res) => res.json());
      if (!r.success) {
        router.push("/auth/login");
        return;
      }

      // Tenant guard: caller must own this restaurant (or be super-admin)
      if (session.user.role === "restaurant" && session.user.id !== r.restaurant._id) {
        router.push("/auth/login");
        return;
      }
      setRestaurant(r.restaurant);

      const d = await fetch(`/api/<your-resource>?restaurantId=${r.restaurant._id}`).then((res) => res.json());
      if (d.success) setData(d.data);
      setLoading(false);
    };

    load();
  }, [slug, session, status, router]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-[#F8F8F8] py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Page header */}
        <header className="mb-6">
          <p className="text-[10px] tracking-[0.3em] text-[#5067AA] uppercase mb-1">{restaurant?.name}</p>
          <h1 className="text-2xl font-serif italic text-stone-900">Page title</h1>
        </header>

        {/* Content */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          {/* ... */}
        </div>
      </div>
    </div>
  );
}
```

## Existing admin pages — what to copy from

| Page | Pattern |
|---|---|
| `items/page.tsx` | CRUD with form, image upload, dietary tags |
| `menu/page.tsx` | Section management with drag/drop |
| `tables/page.tsx` | QR generation flow (Cloudinary upload) |
| `orders/page.tsx` | List + filters + status updates |
| `kitchen/page.tsx` | SSE live feed (`/api/orders/stream`) |
| `analytics/page.tsx` | Recharts + aggregation API |
| `feedback/page.tsx` | Sentiment summary cards |

## Side nav / layout

Admin pages share a common shell. Check `app/admin/[slug]/layout.tsx` (if present) for the side nav pattern. Pages should not duplicate the nav themselves.

## Data mutation pattern

Use plain `fetch` with optimistic updates only when the mutation is fast and reversible. For destructive actions, use a `confirm()` dialog (the codebase doesn't use a modal library yet — keep it simple).

```tsx
const handleDelete = async (id: string) => {
  if (!confirm("Delete this item?")) return;
  const res = await fetch(`/api/items/${id}`, { method: "DELETE" });
  const data = await res.json();
  if (data.success) {
    setData((prev) => prev.filter((x) => x._id !== id));
  } else {
    alert(data.error || "Failed to delete");
  }
};
```

## Don't

- Don't render admin UI server-side — use `"use client"`. Sessions read better client-side here.
- Don't fetch by slug for data queries; fetch by `_id`. Slug is for URL/SEO.
- Don't skip the tenant guard — if A logs in and visits `/admin/restaurant-B/...`, your page must redirect.
- Don't build a custom nav per page; reuse the layout shell.
