import type { Metadata } from "next";
import PlagiarismCheckPage from "@/components/plagiarism-check-page";

export const metadata: Metadata = {
  title: "Plagiarism Check | Aether SEO",
  description:
    "Run a paid AI-assisted plagiarism review, rewrite flagged lines, preview the source page, and export a branded PDF.",
};

export default function Page() {
  return <PlagiarismCheckPage />;
}
