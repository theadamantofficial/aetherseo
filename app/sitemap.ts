import type { MetadataRoute } from "next";
import { getPublicBlogPosts, siteLanguages } from "@/lib/site-language";
import { getSiteUrl, localeCodes } from "@/lib/site-routing";

function buildLanguageMap(pathBuilder: (language: (typeof siteLanguages)[number]) => string) {
  const siteUrl = getSiteUrl();

  return Object.fromEntries(
    siteLanguages.map((language) => [localeCodes[language], `${siteUrl}${pathBuilder(language)}`]),
  );
}

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const lastModified = new Date();
  const entries: MetadataRoute.Sitemap = [];

  entries.push(
    ...siteLanguages.flatMap((language) => [
      {
        url: `${siteUrl}/${language}`,
        lastModified,
        changeFrequency: "weekly",
        priority: 1,
        alternates: {
          languages: buildLanguageMap((lang) => `/${lang}`),
        },
      },
      {
        url: `${siteUrl}/${language}/blog`,
        lastModified,
        changeFrequency: "weekly",
        priority: 0.9,
        alternates: {
          languages: buildLanguageMap((lang) => `/${lang}/blog`),
        },
      },
      {
        url: `${siteUrl}/${language}/privacy-policy`,
        lastModified,
        changeFrequency: "monthly",
        priority: 0.4,
        alternates: {
          languages: buildLanguageMap((lang) => `/${lang}/privacy-policy`),
        },
      },
      {
        url: `${siteUrl}/${language}/terms-of-service`,
        lastModified,
        changeFrequency: "monthly",
        priority: 0.4,
        alternates: {
          languages: buildLanguageMap((lang) => `/${lang}/terms-of-service`),
        },
      },
      ...getPublicBlogPosts(language).map((post) => ({
        url: `${siteUrl}/${language}/blog/${post.slug}`,
        lastModified,
        changeFrequency: "monthly" as const,
        priority: 0.7,
      })),
    ]),
  );

  return entries;
}
