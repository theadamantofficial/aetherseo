"use client";

import { useEffect } from "react";
import { preloadSiteLoader } from "@/components/site-loader";

export default function SiteLoaderWarmup() {
  useEffect(() => {
    preloadSiteLoader();
  }, []);

  return null;
}
