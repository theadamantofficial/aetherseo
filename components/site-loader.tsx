"use client";

type SiteLoaderProps = {
  className?: string;
  size?: "sm" | "md" | "lg" | "full";
};

function LoaderGlyph({ className }: { className: string }) {
  return (
    <div aria-hidden="true" className={`relative flex items-center justify-center rounded-full ${className}`}>
      <div className="site-skeleton absolute inset-0 rounded-full" />
      <div className="absolute inset-[10%] animate-spin rounded-full border-[3px] border-[var(--site-primary)]/20 border-t-[var(--site-primary)] border-r-[var(--site-primary)]/60" />
      <div className="absolute inset-[34%] rounded-full bg-[var(--site-primary)]/14" />
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
    sm: { container: "min-h-[120px]", animation: "h-20 w-20" },
    md: { container: "min-h-[280px]", animation: "h-36 w-36" },
    lg: { container: "min-h-[400px]", animation: "h-48 w-48" },
    full: {
      container: "min-h-screen supports-[height:100dvh]:min-h-dvh",
      animation: "h-48 w-48",
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
