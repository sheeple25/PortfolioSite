import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The (labs) routes already send `noindex` via metadata; this keeps
      // well-behaved crawlers from spending a request on them at all.
      disallow: ["/pixel-lab", "/text-lab"],
    },
    sitemap: new URL("/sitemap.xml", SITE_URL).toString(),
  };
}
