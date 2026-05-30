/**
 * QMLogo — the Quartermaster compass-rose brand mark.
 *
 * Single-color (currentColor) so it adapts to any surface: set the color on
 * the parent (gold on dark chrome, ink on the light landing). Pure render.
 */

export interface QMLogoProps {
  size?: number;
  className?: string;
}

export function QMLogo({ size = 28, className }: QMLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle
        cx="16"
        cy="16"
        r="13"
        stroke="currentColor"
        strokeOpacity="0.3"
        strokeWidth="1.5"
      />
      <circle
        cx="16"
        cy="16"
        r="9.5"
        stroke="currentColor"
        strokeOpacity="0.15"
        strokeWidth="1"
      />
      {/* Compass star */}
      <polygon points="16,2.5 18.6,16 16,13.6 13.4,16" fill="currentColor" />
      <polygon
        points="16,29.5 18.6,16 16,18.4 13.4,16"
        fill="currentColor"
        fillOpacity="0.4"
      />
      <polygon
        points="2.5,16 16,13.4 13.6,16 16,18.6"
        fill="currentColor"
        fillOpacity="0.7"
      />
      <polygon
        points="29.5,16 16,13.4 18.4,16 16,18.6"
        fill="currentColor"
        fillOpacity="0.4"
      />
      <circle cx="16" cy="16" r="1.9" fill="currentColor" />
    </svg>
  );
}
