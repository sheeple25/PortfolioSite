import type { MetadataRoute } from "next";
import { ROUTES, SITE_URL } from "@/lib/site";
import { getWritingSummaries } from "@/lib/writing";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const staticRoutes: MetadataRoute.Sitemap = ROUTES.map((route) => ({
    url: new URL(route, SITE_URL).toString(),
    lastModified,
    changeFrequency: "monthly",
    priority: route === "/" ? 1 : 0.8,
  }));

  // Drafts are already filtered out by `getWritingSummaries` in a production
  // build, so an unpublished document can't leak into the sitemap.
  const documents: MetadataRoute.Sitemap = getWritingSummaries().map((doc) => ({
    url: new URL(`/writing/${doc.slug}`, SITE_URL).toString(),
    lastModified: doc.meta.date ? new Date(doc.meta.date) : lastModified,
    changeFrequency: "yearly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...documents];
}
