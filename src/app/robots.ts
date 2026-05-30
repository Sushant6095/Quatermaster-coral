import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

/** robots.txt — allow crawling everything except the JSON/SSE API surface. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
