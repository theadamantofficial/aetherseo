"use client";

type SiteLoaderProps = {
  className?: string;
  size?: "sm" | "md" | "lg" | "full";
};

function LoaderGlyph({ className }: { className: string }) {
  return (
    <div aria-hidden="true" className={`site-loader-glyph relative flex items-center justify-center rounded-full ${className}`}>
      <div className="site-loader-aura absolute inset-0 rounded-full" />
      <div className="site-loader-grid absolute inset-[8%] rounded-full" />
      <div className="site-loader-ring site-loader-ring-primary absolute inset-[12%] rounded-full" />
      <div className="site-loader-ring site-loader-ring-secondary absolute inset-[25%] rounded-full" />
      <div className="site-loader-orbit absolute inset-[6%] rounded-full">
        <span className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 rounded-full" />
      </div>
      <div className="site-loader-orbit site-loader-orbit-reverse absolute inset-[20%] rounded-full">
        <span className="absolute bottom-0 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full" />
      </div>
      <div className="site-loader-core relative flex h-[38%] w-[38%] items-center justify-center rounded-full">
        <svg viewBox="0 0 18 18" fill="none" className="h-[58%] w-[58%]" aria-hidden="true">
          <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.2" />
          <path
            d="M5.5 13L9 5L12.5 13"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M6.8 10.2h4.4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

/**
 * Render a stable CSS-only loading state across the app.
 * @param props.size - Controls the loader dimensions and container height.
 * @param props.className - Additional classes on the outer wrapper.
 */
export default function SiteLoader({ className = "", size = "md" }: SiteLoaderProps) {
  const sizeMap = {
    sm: { container: "min-h-[120px]", animation: "h-16 w-16" },
    md: { container: "min-h-[280px]", animation: "h-28 w-28" },
    lg: { container: "min-h-[400px]", animation: "h-36 w-36" },
    full: {
      container: "min-h-screen supports-[height:100dvh]:min-h-dvh",
      animation: "h-40 w-40",
    },
  } as const;

  const resolvedSize = sizeMap[size];

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={`flex items-center justify-center ${resolvedSize.container} ${className}`.trim()}
    >
      <span className="sr-only">Loading</span>
      <LoaderGlyph className={resolvedSize.animation} />
    </div>
  );
}
