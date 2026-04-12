export type PlagiarismRiskLevel = "High" | "Medium" | "Low";

export type PlagiarismMatch = {
  line: string;
  risk: PlagiarismRiskLevel;
  reason: string;
  alternative: string;
  keywordAlternatives: string[];
};

export type PlagiarismPagePreview = {
  canonicalUrl: string;
  excerpt: string;
  faviconUrl: string | null;
  firstHeading: string;
  host: string;
  imageUrl: string | null;
  metaDescription: string;
  sentenceCount: number;
  title: string;
  wordCount: number;
};

export type PlagiarismLockedSuggestion = {
  body: string;
  creditCost: number;
  creditType: "prompt" | "image";
  title: string;
};

export type PlagiarismPdfExport = {
  fileName: string;
  highlights: string[];
  subtitle: string;
  title: string;
};

export type PlagiarismRun = {
  altTextSuggestions: string[];
  alternativeDraft: string[];
  createdAt: string;
  id: string;
  keywords: string[];
  language: string;
  lockedSuggestions: PlagiarismLockedSuggestion[];
  matches: PlagiarismMatch[];
  pdfExport: PlagiarismPdfExport;
  preview: PlagiarismPagePreview;
  riskLabel: string;
  score: number;
  summary: string;
  title: string;
  url: string;
  warnings: string[];
};

export type PlagiarismRunDraft = Omit<PlagiarismRun, "id" | "createdAt"> &
  Partial<Pick<PlagiarismRun, "id" | "createdAt">>;
