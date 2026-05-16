import type { MetadataRoute } from "next";

// Base URL is read from NEXT_PUBLIC_BASE_URL at build time. Falls back to the
// prod canonical so the file is still useful when env isn't set during a
// local "next build".
const baseUrl =
  process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") || "https://bawarchie.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/about",
          "/contact",
          "/terms",
          "/privacy",
          "/refund",
          "/shipping",
        ],
        disallow: [
          "/api/",
          "/admin/",
          "/super-admin/",
          "/order-success",
          // Customer table URLs are private order-flow links; no SEO value
          // and they should not be indexed.
          "/r/",
          "/chat",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
