import type { MetadataRoute } from "next";

const baseUrl =
  process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") || "https://bawarchie.app";

// Static sitemap covering only the public-facing pages. The customer order
// flow (/r/[restaurantSlug]/t/[tableSlug]) is intentionally excluded — those
// are private QR-issued URLs that should not be indexed. Restaurant admin
// routes are excluded for the same reason.
//
// `lastModified` is set to the MVP launch / legal pages effective date so
// crawlers see a stable, meaningful timestamp.
const LEGAL_LAST_MODIFIED = new Date("2025-11-22");

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    {
      url: `${baseUrl}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: LEGAL_LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: LEGAL_LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: LEGAL_LAST_MODIFIED,
      changeFrequency: "yearly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: LEGAL_LAST_MODIFIED,
      changeFrequency: "yearly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/refund`,
      lastModified: LEGAL_LAST_MODIFIED,
      changeFrequency: "yearly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/shipping`,
      lastModified: LEGAL_LAST_MODIFIED,
      changeFrequency: "yearly",
      priority: 0.6,
    },
  ];
}
