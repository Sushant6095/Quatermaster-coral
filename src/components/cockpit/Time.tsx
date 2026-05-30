"use client";

/**
 * Client-only time renderers.
 *
 * `relativeTime`/`formatClock` depend on the current clock and the viewer's
 * timezone, so server HTML and client hydration can disagree (React #418).
 * These gate the real value behind a mount effect: the server and the first
 * client render emit the same neutral placeholder, then the live value fills
 * in after mount — making a hydration mismatch impossible by construction.
 */

import { useEffect, useState } from "react";
import { relativeTime, formatClock } from "@/lib/utils/time";

export interface RelativeTimeProps {
  iso?: string;
}

export function RelativeTime({ iso }: RelativeTimeProps) {
  const [text, setText] = useState("…");
  useEffect(() => {
    setText(relativeTime(iso));
  }, [iso]);
  return <>{text}</>;
}

export interface ClockTimeProps {
  iso: string;
}

export function ClockTime({ iso }: ClockTimeProps) {
  const [text, setText] = useState("--:--");
  useEffect(() => {
    setText(formatClock(iso));
  }, [iso]);
  return <>{text}</>;
}
