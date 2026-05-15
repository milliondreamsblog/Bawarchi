import { auth } from "@/lib/auth";
import { verifyNativeToken } from "@/lib/jwt";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

const FORBIDDEN = () =>
  NextResponse.json(
    { success: false, error: "Forbidden" },
    { status: 403 }
  );

const UNAUTHORIZED = (msg = "Authentication required") =>
  NextResponse.json({ success: false, error: msg }, { status: 401 });

/**
 * Resolve the current session, accepting either:
 *   1. Authorization: Bearer <jwt>  — native apps (apps/restaurant, apps/customer)
 *   2. NextAuth session cookie       — web
 *
 * Returns a session in NextAuth's `{ user: { id, role, slug, email, name } }`
 * shape regardless of source, so existing route code that reads
 * `session.user.id` etc. keeps working unchanged.
 */
async function resolveSession() {
  const h = await headers();
  const authHeader = h.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice("Bearer ".length).trim();
    const payload = await verifyNativeToken(token);
    if (!payload) {
      return { error: UNAUTHORIZED("Invalid token"), session: null };
    }
    return {
      error: null as null,
      session: {
        user: {
          id: payload.sub,
          email: payload.email,
          name: payload.name,
          role: payload.role,
          slug: payload.slug,
        },
        expires: "",
      } as unknown as Awaited<ReturnType<typeof auth>>,
    };
  }

  const session = await auth();
  if (!session?.user) {
    return { error: UNAUTHORIZED(), session: null };
  }
  return { error: null as null, session };
}

/**
 * Verifies that the incoming request has a valid restaurant or super-admin session.
 * Accepts either a NextAuth cookie OR a Bearer JWT from /api/auth/native.
 *
 * @example
 * const { error, session } = await requireAuth();
 * if (error) return error;
 */
export async function requireAuth() {
  const { error, session } = await resolveSession();
  if (error) return { error, session: null };

  const role = (session!.user as { role?: string }).role;
  if (role !== "restaurant" && role !== "super-admin") {
    return { error: FORBIDDEN(), session: null };
  }
  return { error: null, session };
}

/**
 * Verifies that the incoming request has a valid super-admin session.
 * Accepts either a NextAuth cookie OR a Bearer JWT.
 *
 * @example
 * const { error, session } = await requireSuperAdmin();
 * if (error) return error;
 */
export async function requireSuperAdmin() {
  const { error, session } = await resolveSession();
  if (error) return { error, session: null };

  const role = (session!.user as { role?: string }).role;
  if (role !== "super-admin") {
    return { error: FORBIDDEN(), session: null };
  }
  return { error: null, session };
}
