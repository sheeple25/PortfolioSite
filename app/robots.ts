import type { MetadataRoute } from "next";
import { LAB_ROUTES, SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      /*
       * The labs don't exist in a production build at all (see
       * `pageExtensions` in next.config.ts), so this is belt-and-braces for
       * anything that crawled them while they did. Derived from `LAB_ROUTES`
       * rather than retyped, because the hand-maintained version had drifted
       * to three of the six.
       */
      disallow: LAB_ROUTES.map((lab) => lab.href),
    },
    sitemap: new URL("/sitemap.xml", SITE_URL).toString(),
  };
}
