"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const ANIMATION_PATH = "/lottie-loader.json";
const STORAGE_KEY = "aether-site-loader-animation-v1";

type LottiePlayerProps = {
  animationData: object;
  autoplay?: boolean;
  className?: string;
  loop?: boolean;
  onDOMLoaded?: () => void;
};

const Lottie = dynamic<LottiePlayerProps>(() => import("lottie-react"), {
  ssr: false,
});

type SiteLoaderProps = {
  className?: string;
  size?: "sm" | "md" | "lg" | "full";
};

let cachedAnimationData: object | null = null;
let animationRequest: Promise<object | null> | null = null;

function readStoredAnimationData() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const storedData = window.localStorage.getItem(STORAGE_KEY);
    if (!storedData) {
      return null;
    }

    const parsedData = JSON.parse(storedData) as object;
    cachedAnimationData = parsedData;
    return parsedData;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function storeAnimationData(animationData: object) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(animationData));
  } catch {}
}

function loadAnimationData() {
  if (cachedAnimationData) {
    return Promise.resolve(cachedAnimationData);
  }

  const storedAnimationData = readStoredAnimationData();
  if (storedAnimationData) {
    return Promise.resolve(storedAnimationData);
  }

  if (!animationRequest) {
    animationRequest = fetch(ANIMATION_PATH, { cache: "force-cache" })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Failed to load loader animation.");
        }

        const nextAnimationData = (await response.json()) as object;
        cachedAnimationData = nextAnimationData;
        storeAnimationData(nextAnimationData);
        return nextAnimationData;
      })
      .catch(() => null)
      .finally(() => {
        if (!cachedAnimationData) {
          animationRequest = null;
        }
      });
  }

  return animationRequest;
}

export function preloadSiteLoader() {
  if (typeof window === "undefined") {
    return;
  }

  void loadAnimationData();
}

function getInitialAnimationData() {
  return cachedAnimationData ?? readStoredAnimationData();
}

function LoaderFallback({ className, visible }: { className: string; visible: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 flex items-center justify-center rounded-full transition-opacity duration-200 ${
        visible ? "opacity-100" : "opacity-0"
      } ${className}`}
    >
      <div className="site-skeleton absolute inset-0 rounded-full" />
      <div className="absolute inset-[10%] animate-spin rounded-full border-[3px] border-[var(--site-primary)]/20 border-t-[var(--site-primary)] border-r-[var(--site-primary)]/60" />
      <div className="absolute inset-[34%] rounded-full bg-[var(--site-primary)]/14" />
    </div>
  );
}

/**
 * Render a centered loading animation that reuses cached JSON and avoids route-transition races.
 * @param props.size - Controls the animation dimensions and container height.
 * @param props.className - Additional classes on the outer wrapper.
 */
export default function SiteLoader({ className = "", size = "md" }: SiteLoaderProps) {
  const [animationData, setAnimationData] = useState<object | null>(getInitialAnimationData);
  const [isAnimationReady, setIsAnimationReady] = useState(false);
  const [shouldRenderAnimation, setShouldRenderAnimation] = useState(false);

  useEffect(() => {
    preloadSiteLoader();
    let isActive = true;

    if (!animationData) {
      void loadAnimationData().then((nextAnimationData) => {
        if (isActive && nextAnimationData) {
          setAnimationData(nextAnimationData);
        }
      });
    }

    return () => {
      isActive = false;
    };
  }, [animationData]);

  useEffect(() => {
    setIsAnimationReady(false);

    if (!animationData) {
      setShouldRenderAnimation(false);
      return;
    }

    setShouldRenderAnimation(false);
    const delay = size === "full" ? 160 : 80;
    const timerId = window.setTimeout(() => {
      setShouldRenderAnimation(true);
    }, delay);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [animationData, size]);

  const sizeMap = {
    sm: { container: "min-h-[120px]", animation: "h-20 w-20" },
    md: { container: "min-h-[280px]", animation: "h-36 w-36" },
    lg: { container: "min-h-[400px]", animation: "h-48 w-48" },
    full: {
      container: "min-h-screen supports-[height:100dvh]:min-h-dvh",
      animation: "h-48 w-48",
    },
  } as const;

  const resolvedSize = sizeMap[size];
  const showFallback = !animationData || !shouldRenderAnimation || !isAnimationReady;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={`flex items-center justify-center ${resolvedSize.container} ${className}`.trim()}
    >
      <span className="sr-only">Loading</span>
      <div className={`relative ${resolvedSize.animation}`}>
        <LoaderFallback className={resolvedSize.animation} visible={showFallback} />
        {animationData && shouldRenderAnimation ? (
          <Lottie
            animationData={animationData}
            loop
            autoplay
            onDOMLoaded={() => {
              setIsAnimationReady(true);
            }}
            className={`${resolvedSize.animation} transition-opacity duration-200 ${
              showFallback ? "opacity-0" : "opacity-100"
            }`}
          />
        ) : null}
      </div>
    </div>
  );
}
