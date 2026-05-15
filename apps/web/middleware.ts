import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const session = await auth();
  const { pathname } = request.nextUrl;

  // Allow access to login pages without authentication
  if (pathname === "/auth/login" || pathname === "/auth/signup" || pathname === "/super-admin/login") {
    return NextResponse.next();
  }

  // Protect /admin/* routes
  if (pathname.startsWith("/admin")) {
    if (!session) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    if (session.user.role !== "restaurant" && session.user.role !== "super-admin") {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
  }

  // Protect /super-admin/* routes (except login)
  if (pathname.startsWith("/super-admin")) {
    if (!session || session.user.role !== "super-admin") {
      return NextResponse.redirect(new URL("/super-admin/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/super-admin/:path*"],
};
