import { redirect } from "next/navigation";

export default async function BlogArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  redirect(`/en/blog/${slug}`);
}
