import type { MetadataRoute } from "next";
import { ROUTES, SITE_URL } from "@/lib/site";
import { getWritingSummaries } from "@/lib/writing";
import { getProjectSummaries } from "@/lib/projects";
import { getArchiveSummaries } from "@/lib/archive";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const staticRoutes: MetadataRoute.Sitemap = ROUTES.map((route) => ({
    url: new URL(route, SITE_URL).toString(),
    lastModified,
    changeFrequency: "monthly",
    priority: route === "/" ? 1 : 0.8,
  }));

  // Drafts are already filtered out by the summary helpers in a production
  // build, so an unpublished document can't leak into the sitemap.
  const entry = (path: string) => (doc: { slug: string; meta: { date: string } }) => ({
    url: new URL(`${path}/${doc.slug}`, SITE_URL).toString(),
    lastModified: doc.meta.date ? new Date(doc.meta.date) : lastModified,
    changeFrequency: "yearly" as const,
    priority: 0.6,
  });

  const documents: MetadataRoute.Sitemap = getWritingSummaries().map(
    entry("/writing")
  );
  const projects: MetadataRoute.Sitemap = getProjectSummaries().map(
    entry("/projects")
  );
  const archive: MetadataRoute.Sitemap = getArchiveSummaries().map(
    entry("/archive")
  );

  return [...staticRoutes, ...documents, ...projects, ...archive];
}
