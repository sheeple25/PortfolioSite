import type { MetadataRoute } from "next";
import { ROUTES, SITE_URL } from "@/lib/site";
import { getWritingSummaries } from "@/lib/writing";
import { getEntries } from "@/lib/entries";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const staticRoutes: MetadataRoute.Sitemap = ROUTES.map((route) => ({
    url: new URL(route, SITE_URL).toString(),
    lastModified,
    changeFrequency: "monthly",
    priority: route === "/" ? 1 : 0.8,
  }));

  const documents: MetadataRoute.Sitemap = getWritingSummaries().map((doc) => ({
    url: new URL(`/writing/${doc.slug}`, SITE_URL).toString(),
    lastModified: doc.meta.date ? new Date(doc.meta.date) : lastModified,
    changeFrequency: "yearly",
    priority: 0.6,
  }));

  /*
   * One list for both sections, and the entry's own `pageHref` rather than a
   * path glued together here — Work and Archive share a URL space now, so
   * guessing at one from the section would produce a link that 308s at best.
   *
   * Entries whose content lives elsewhere (`source: "external"`) have no page
   * of ours to list. Drafts are already gone: they don't resolve at all in a
   * production build, so an unpublished project can't leak into the sitemap.
   */
  const projects: MetadataRoute.Sitemap = getEntries()
    .filter((entry) => entry.pageHref !== null)
    .map((entry) => ({
      url: new URL(entry.pageHref!, SITE_URL).toString(),
      lastModified: entry.meta.date ? new Date(entry.meta.date) : lastModified,
      changeFrequency: "yearly",
      priority: 0.6,
    }));

  return [...staticRoutes, ...documents, ...projects];
}
