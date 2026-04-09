import type { MetadataRoute } from "next";
import { listPublishedBlogPosts } from "@/lib/public-blog-posts";
import { getSiteUrl, localeCodes } from "@/lib/site-routing";
import { siteLanguages } from "@/lib/site-language";

function buildLanguageMap(pathBuilder: (language: (typeof siteLanguages)[number]) => string) {
  const siteUrl = getSiteUrl();

  return Object.fromEntries(
    siteLanguages.map((language) => [localeCodes[language], `${siteUrl}${pathBuilder(language)}`]),
  );
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const lastModified = new Date();
  const entries: MetadataRoute.Sitemap = [];
  const blogEntries = await Promise.all(
    siteLanguages.map(async (language) => ({
      language,
      posts: await listPublishedBlogPosts(language),
    })),
  );

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
      ...(
        blogEntries
          .find((entry) => entry.language === language)
          ?.posts.map((post) => ({
            url: `${siteUrl}/${language}/blog/${post.slug}`,
            lastModified,
            changeFrequency: "monthly" as const,
            priority: 0.7,
          })) ?? []
      ),
    ]),
  );

  return entries;
}
