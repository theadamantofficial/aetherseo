"use client";

import { useEffect, useState, type ComponentType } from "react";

const ANIMATION_PATH = "/lottie-loader.json";
const STORAGE_KEY = "aether-site-loader-animation-v1";

type LottieRenderer = ComponentType<{
  animationData: object;
  autoplay?: boolean;
  className?: string;
  loop?: boolean;
}>;

type SiteLoaderProps = {
  className?: string;
  size?: "sm" | "md" | "lg" | "full";
};

let cachedAnimationData: object | null = null;
let cachedLottieRenderer: LottieRenderer | null = null;
let animationRequest: Promise<object | null> | null = null;
let lottieRendererRequest: Promise<LottieRenderer | null> | null = null;

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

        const animationData = (await response.json()) as object;
        cachedAnimationData = animationData;
        storeAnimationData(animationData);
        return animationData;
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

function loadLottieRenderer() {
  if (cachedLottieRenderer) {
    return Promise.resolve(cachedLottieRenderer);
  }

  if (!lottieRendererRequest) {
    lottieRendererRequest = import("lottie-react")
      .then((module) => {
        cachedLottieRenderer = module.default as LottieRenderer;
        return cachedLottieRenderer;
      })
      .catch(() => null)
      .finally(() => {
        if (!cachedLottieRenderer) {
          lottieRendererRequest = null;
        }
      });
  }

  return lottieRendererRequest;
}

export function preloadSiteLoader() {
  if (typeof window === "undefined") {
    return;
  }

  void loadLottieRenderer();
  void loadAnimationData();
}

function getInitialAnimationData() {
  return cachedAnimationData ?? readStoredAnimationData();
}

function LoaderFallback({ className }: { className: string }) {
  return (
    <div
      aria-hidden="true"
      className={`relative flex items-center justify-center rounded-full ${className}`}
    >
      <div className="site-skeleton absolute inset-0 rounded-full" />
      <div className="absolute inset-[10%] animate-spin rounded-full border-[3px] border-[var(--site-primary)]/20 border-t-[var(--site-primary)] border-r-[var(--site-primary)]/60" />
      <div className="absolute inset-[34%] rounded-full bg-[var(--site-primary)]/14" />
    </div>
  );
}

/**
 * Render a centered loading animation that can be warmed and reused across screens.
 * @param props.size - Controls the animation dimensions and container height.
 * @param props.className - Additional classes on the outer wrapper.
 */
export default function SiteLoader({ className = "", size = "md" }: SiteLoaderProps) {
  const [animationData, setAnimationData] = useState<object | null>(getInitialAnimationData);
  const [LottieRendererComponent, setLottieRendererComponent] = useState<LottieRenderer | null>(
    cachedLottieRenderer,
  );

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

    if (!LottieRendererComponent) {
      void loadLottieRenderer().then((nextLottieRenderer) => {
        if (isActive && nextLottieRenderer) {
          setLottieRendererComponent(() => nextLottieRenderer);
        }
      });
    }

    return () => {
      isActive = false;
    };
  }, [animationData, LottieRendererComponent]);

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
  const canRenderAnimation = Boolean(animationData && LottieRendererComponent);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={`flex items-center justify-center ${resolvedSize.container} ${className}`.trim()}
    >
      <span className="sr-only">Loading</span>
      <div className={`relative ${resolvedSize.animation}`}>
        {canRenderAnimation && LottieRendererComponent && animationData ? (
          <LottieRendererComponent
            animationData={animationData}
            loop
            autoplay
            className={`${resolvedSize.animation} transition-opacity duration-200`}
          />
        ) : null}
        {!canRenderAnimation ? <LoaderFallback className={resolvedSize.animation} /> : null}
      </div>
    </div>
  );
}
