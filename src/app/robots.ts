import type { MetadataRoute } from "next";

const BASE_URL = "https://objectif4c2.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/dashboard/*", "/admin", "/admin/*", "/api/*", "/arena/*"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
