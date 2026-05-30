import type { MetadataRoute } from "next";
import { SITE_URL, PUBLIC_ROUTES } from "@/lib/seo";

/** XML sitemap generated from the public route list in @/lib/seo. */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return PUBLIC_ROUTES.map((route) => {
    const isHome = route === "";
    return {
      url: `${SITE_URL}${route}`,
      lastModified,
      changeFrequency: isHome ? "weekly" : "daily",
      priority: isHome ? 1 : 0.7,
    };
  });
}
