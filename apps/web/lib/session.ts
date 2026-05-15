import { auth } from "@/lib/auth";
import { verifyNativeToken } from "@/lib/jwt";

export type Session = {
  id: string;
  email: string;
  name: string;
  role: "super-admin" | "restaurant";
  slug?: string;
};

/**
 * Resolve the current session from either:
 *   1. Authorization: Bearer <jwt> header (native apps)
 *   2. NextAuth session cookie (web)
 *
 * Bearer wins when both are present so a native build can talk to a server
 * that also happens to have a logged-in web cookie sitting around.
 */
export async function getSessionFromRequest(req: Request): Promise<Session | null> {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice("Bearer ".length).trim();
    const payload = await verifyNativeToken(token);
    if (payload) {
      return {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        role: payload.role,
        slug: payload.slug,
      };
    }
  }

  const session = await auth();
  const user = session?.user as
    | { id?: string; email?: string; name?: string; role?: string; slug?: string }
    | undefined;
  if (user?.id && user.role) {
    return {
      id: user.id,
      email: user.email ?? "",
      name: user.name ?? "",
      role: user.role as Session["role"],
      slug: user.slug,
    };
  }

  return null;
}
