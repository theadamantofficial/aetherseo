"use client";

import Link from "next/link";
import { footerCopy } from "@/lib/legal-copy";
import type { SiteLanguage } from "@/lib/site-language";

export default function PublicFooter({ language }: { language: SiteLanguage }) {
  const copy = footerCopy[language];

  return (
    <footer className="site-panel mt-16 rounded-[2rem] px-7 py-8">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-sm font-semibold">{copy.product}</p>
          <p className="mt-2 text-sm font-medium">{copy.parent}</p>
          <p className="site-muted mt-1 text-xs">{copy.rights}</p>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-sm">
          <Link href={`/${language}/privacy-policy`} className="site-link-accent">
            {copy.privacy}
          </Link>
          <Link href={`/${language}/terms-of-service`} className="site-link-accent">
            {copy.terms}
          </Link>
        </div>
      </div>
    </footer>
  );
}
