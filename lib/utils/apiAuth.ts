import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * Verifies that the incoming request has a valid restaurant or super-admin session.
 * Use this at the top of any admin-facing API route handler.
 *
 * @example
 * const { error, session } = await requireAuth();
 * if (error) return error;
 */
export async function requireAuth() {
  const session = await auth();

  if (!session?.user) {
    return {
      error: NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      ),
      session: null,
    };
  }

  if (session.user.role !== "restaurant" && session.user.role !== "super-admin") {
    return {
      error: NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      ),
      session: null,
    };
  }

  return { error: null, session };
}

/**
 * Verifies that the incoming request has a valid super-admin session.
 * Use this at the top of any super-admin-only API route handler.
 *
 * @example
 * const { error, session } = await requireSuperAdmin();
 * if (error) return error;
 */
export async function requireSuperAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "super-admin") {
    return {
      error: NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      ),
      session: null,
    };
  }
  return { error: null, session };
}
