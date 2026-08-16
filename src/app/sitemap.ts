import type { MetadataRoute } from "next";

const BASE_URL = "https://objectif4c2.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/comprehension-orale",
    "/comprehension-ecrite",
    "/expression-ecrite",
    "/expression-orale",
  ];

  return routes.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7,
  }));
}
