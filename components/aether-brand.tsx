import Image from "next/image";
import Link from "next/link";
import type { MouseEventHandler } from "react";

type AetherBrandProps = {
  href: string;
  className?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  priority?: boolean;
  titleClassName?: string;
  subtitleClassName?: string;
  logoClassName?: string;
};

export default function AetherBrand({
  href,
  className = "",
  onClick,
  priority = false,
  titleClassName = "",
  subtitleClassName = "",
  logoClassName = "",
}: AetherBrandProps) {
  return (
    <Link
      href={href}
      className={`flex min-w-0 items-center gap-3 rounded-full px-1 py-1 transition hover:opacity-90 ${className}`.trim()}
      onClick={onClick}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[rgba(125,134,255,0.18)] bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.98),rgba(236,240,255,0.9))] shadow-[0_14px_30px_rgba(91,103,255,0.16)] sm:h-11 sm:w-11 ${logoClassName}`.trim()}
      >
        <Image
          src="/aether-logo-mark.png"
          alt=""
          width={44}
          height={44}
          priority={priority}
          className="h-full w-full scale-[1.55] object-cover"
        />
      </span>
      <span className="min-w-0">
        <span
          className={`block truncate text-[15px] font-semibold sm:text-base md:text-lg ${titleClassName}`.trim()}
        >
          Aether SEO
        </span>
        <span
          className={`site-muted block text-[9px] uppercase tracking-[0.24em] sm:text-[11px] ${subtitleClassName}`.trim()}
        >
          AI MEETS SEO
        </span>
      </span>
    </Link>
  );
}
