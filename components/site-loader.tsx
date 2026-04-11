"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

const ANIMATION_PATH = "/lottie-loader.json";

let cachedData: object | null = null;

type SiteLoaderProps = {
  className?: string;
  size?: "sm" | "md" | "lg" | "full";
};

/**
 * Render a centered Lottie loading animation.
 * @param props.size - Controls the animation dimensions and container height.
 * @param props.className - Additional classes on the outer wrapper.
 */
export default function SiteLoader({ className = "", size = "md" }: SiteLoaderProps) {
  const [data, setData] = useState<object | null>(cachedData);

  useEffect(() => {
    if (cachedData) {
      setData(cachedData);
      return;
    }

    fetch(ANIMATION_PATH)
      .then((res) => res.json() as Promise<object>)
      .then((json) => {
        cachedData = json;
        setData(json);
      })
      .catch(() => {});
  }, []);

  const sizeMap = {
    sm: { container: "min-h-[120px]", animation: "h-20 w-20" },
    md: { container: "min-h-[280px]", animation: "h-36 w-36" },
    lg: { container: "min-h-[400px]", animation: "h-48 w-48" },
    full: { container: "min-h-screen supports-[height:100dvh]:min-h-dvh", animation: "h-48 w-48" },
  };

  const s = sizeMap[size];

  return (
    <div className={`flex items-center justify-center ${s.container} ${className}`.trim()}>
      {data ? <Lottie animationData={data} loop autoplay className={s.animation} /> : null}
    </div>
  );
}
