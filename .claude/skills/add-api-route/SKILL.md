---
name: add-api-route
description: Use when adding a new App Router API route handler under app/api/**. Covers the codebase's response envelope, DB connection, multi-tenant guards, and auth patterns specific to this repo. Trigger when user asks to "add an endpoint", "create a route", "expose X via API".
---

# Add API route — repo-specific patterns

## Boilerplate (auth-protected, tenant-scoped)

```ts
// app/api/<resource>/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db.js";
import Resource from "@/lib/models/Resource.js";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const restaurantId = searchParams.get("restaurantId");
  if (!restaurantId) {
    return NextResponse.json({ success: false, error: "restaurantId required" }, { status: 400 });
  }

  // Optional: enforce that the caller owns this restaurant
  if (session.user.role === "restaurant" && session.user.id !== restaurantId) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const data = await Resource.find({ restaurantId }).lean();
  return NextResponse.json({ success: true, data });
}
```

## Rules (non-negotiable)

1. **Always envelope** responses as `{ success: boolean, ... }`. The frontend reads `data.success`. Never return bare arrays.
2. **Always `await connectDB()`** before any Mongoose call. The connection is cached.
3. **Always filter by `restaurantId`** for tenant-scoped collections. Cross-tenant data leaks are the #1 risk in this codebase.
4. **Use `.lean()`** when returning to client — avoids serialization issues with Mongoose docs.
5. **Use `req.json()`** for POST bodies; validate required fields and return 400 with a clear error.
6. **Use `params` from the second arg** for dynamic routes: `({ params }: { params: Promise<{ id: string }> })` then `const { id } = await params;` (Next 16 makes params async).

## Role checks

- Public routes (customer-facing menu, payments, feedback): no auth.
- Restaurant routes: `session.user.role === "restaurant"` AND `session.user.id === restaurantId`.
- Super-admin routes: `session.user.role === "super-admin"`.

## When NOT to add a route

- If the same logic exists in another route, extract a helper to `lib/utils/` instead of duplicating.
- If it's a one-time migration, put it in `scripts/` and run via Node, not as an API.
- If it just reads env config, expose via a `NEXT_PUBLIC_*` var (server-side only secrets stay server-side).
