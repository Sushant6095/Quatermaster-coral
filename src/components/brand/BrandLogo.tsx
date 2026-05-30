/**
 * BrandLogo — real integration logos with official brand colors.
 *
 * Backed by simple-icons where available. Slack was pulled from simple-icons,
 * so its multicolor mark is embedded directly. Anything unknown (e.g. Deel)
 * falls back to a branded monogram. Pure render — safe as a server component.
 */

import {
  siGithub,
  siStripe,
  siOkta,
  siLinear,
  siDiscord,
  siX,
  siJira,
  siGoogle,
  siNotion,
} from "simple-icons";
import type { SimpleIcon } from "simple-icons";
import { cn } from "@/lib/utils/cn";

/** Single-path brands from simple-icons, keyed by our source id. */
const SIMPLE: Record<string, SimpleIcon> = {
  github: siGithub,
  stripe: siStripe,
  okta: siOkta,
  linear: siLinear,
  discord: siDiscord,
  x: siX,
  twitter: siX,
  jira: siJira,
  google: siGoogle,
  notion: siNotion,
};

/** Branded monogram fallback for brands missing from icon libraries. */
const FALLBACK: Record<string, { label: string; color: string }> = {
  deel: { label: "D", color: "#FF5C35" },
};

export interface BrandLogoProps {
  /** Source/brand id (case-insensitive): github, slack, stripe, okta… */
  name: string;
  size?: number;
  className?: string;
  /** Render in the brand's official color(s); otherwise inherit currentColor. */
  colored?: boolean;
  title?: string;
}

export function BrandLogo({
  name,
  size = 16,
  className,
  colored = false,
  title,
}: BrandLogoProps) {
  const key = name.toLowerCase();
  const label = title ?? name;

  if (key === "slack") {
    return (
      <SlackMark
        size={size}
        className={className}
        title={label}
        colored={colored}
      />
    );
  }

  const icon = SIMPLE[key];
  if (icon) {
    return (
      <svg
        role="img"
        viewBox="0 0 24 24"
        width={size}
        height={size}
        className={className}
        fill={colored ? `#${icon.hex}` : "currentColor"}
        aria-label={label}
      >
        <title>{label}</title>
        <path d={icon.path} />
      </svg>
    );
  }

  // Monogram fallback (e.g. Deel).
  const fb = FALLBACK[key];
  return (
    <span
      role="img"
      aria-label={label}
      className={cn(
        "inline-flex items-center justify-center rounded-[4px] font-bold leading-none text-white",
        className
      )}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.46,
        background: fb?.color ?? "#64748B",
      }}
    >
      {(fb?.label ?? name.slice(0, 1)).toUpperCase()}
    </span>
  );
}

interface SlackMarkProps {
  size: number;
  className?: string;
  title: string;
  colored: boolean;
}

/** Slack's multicolor mark (embedded — removed from simple-icons). */
function SlackMark({ size, className, title, colored }: SlackMarkProps) {
  const tint = (brand: string) => (colored ? brand : "currentColor");
  return (
    <svg
      role="img"
      viewBox="0 0 2447.6 2452.5"
      width={size}
      height={size}
      className={className}
      aria-label={title}
    >
      <title>{title}</title>
      <g clipRule="evenodd" fillRule="evenodd">
        <path
          d="m897.4 0c-135.3.1-244.8 109.9-244.7 245.2-.1 135.3 109.5 245.1 244.8 245.2h244.8v-245.1c.1-135.3-109.5-245.1-244.9-245.3.1 0 .1 0 0 0m0 654h-652.6c-135.3.1-244.9 109.9-244.8 245.2-.2 135.3 109.4 245.1 244.7 245.3h652.7c135.3-.1 244.9-109.9 244.8-245.2.1-135.4-109.5-245.2-244.8-245.3z"
          fill={tint("#36c5f0")}
        />
        <path
          d="m2447.6 899.2c.1-135.3-109.5-245.1-244.8-245.2-135.3.1-244.9 109.9-244.8 245.2v245.3h244.8c135.3-.1 244.9-109.9 244.8-245.3zm-652.7 0v-654c.1-135.2-109.4-245-244.7-245.2-135.3.1-244.9 109.9-244.8 245.2v654c-.2 135.3 109.4 245.1 244.7 245.3 135.3-.1 244.9-109.9 244.8-245.3z"
          fill={tint("#2eb67d")}
        />
        <path
          d="m1550.1 2452.5c135.3-.1 244.9-109.9 244.8-245.2.1-135.3-109.5-245.1-244.8-245.2h-244.8v245.2c-.1 135.2 109.5 245 244.8 245.2zm0-654.1h652.7c135.3-.1 244.9-109.9 244.8-245.2.2-135.3-109.4-245.1-244.7-245.3h-652.7c-135.3.1-244.9 109.9-244.8 245.2-.1 135.4 109.4 245.2 244.7 245.3z"
          fill={tint("#ecb22e")}
        />
        <path
          d="m0 1553.2c-.1 135.3 109.5 245.1 244.8 245.2 135.3-.1 244.9-109.9 244.8-245.2v-245.2h-244.8c-135.3.1-244.9 109.9-244.8 245.2zm652.7 0v654c-.2 135.3 109.4 245.1 244.7 245.3 135.3-.1 244.9-109.9 244.8-245.2v-653.9c.2-135.3-109.4-245.1-244.7-245.3-135.4 0-244.9 109.8-244.8 245.1 0 0 0 .1 0 0"
          fill={tint("#e01e5a")}
        />
      </g>
    </svg>
  );
}
