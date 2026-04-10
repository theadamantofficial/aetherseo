"use client";

import { useEffect, useState } from "react";
import { USD_TO_INR_RATE } from "@/lib/paid-plans";

type FxRateResponse = {
  date?: string | null;
  fallback?: boolean;
  rate?: number;
};

export function useUsdInrRate() {
  const [usdToInrRate, setUsdToInrRate] = useState(USD_TO_INR_RATE);
  const [fxDate, setFxDate] = useState<string | null>(null);
  const [isFallback, setIsFallback] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function loadRate() {
      try {
        const response = await fetch("/api/fx/usd-inr", {
          signal: controller.signal,
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as FxRateResponse;
        if (typeof payload.rate !== "number" || !Number.isFinite(payload.rate)) {
          return;
        }

        setUsdToInrRate(payload.rate);
        setFxDate(typeof payload.date === "string" ? payload.date : null);
        setIsFallback(payload.fallback !== false);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    }

    void loadRate();

    return () => {
      controller.abort();
    };
  }, []);

  return { fxDate, isFallback, usdToInrRate };
}
