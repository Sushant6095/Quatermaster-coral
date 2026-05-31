"use client";

/**
 * anime.js v4 helpers — lazy-loaded, SSR-safe, reduced-motion aware.
 *
 * - loadAnime(): single lazy import; sets engine precision once.
 * - useTimelineReveal(): on-mount staggered entrance for [data-animate] children.
 * - useScrollReveal(): scroll-triggered entrance for [data-reveal] children via
 *   anime's onScroll, with a safety fallback so content is never stuck hidden.
 */

import { useEffect, useLayoutEffect, useRef } from "react";

type AnimeModule = typeof import("animejs");

const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

let animePromise: Promise<AnimeModule> | null = null;

export function loadAnime(): Promise<AnimeModule> {
  if (!animePromise) {
    animePromise = import("animejs").then((m) => {
      try {
        // Higher precision = smoother sub-pixel motion on retina.
        m.engine.precision = 4;
      } catch {
        /* engine tuning is best-effort */
      }
      return m;
    });
  }
  return animePromise;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export interface RevealOptions {
  /** Children selector to animate. */
  selector?: string;
  /** translateY start offset (px). */
  y?: number;
  duration?: number;
  /** Per-child stagger (ms). */
  stagger?: number;
  /** Base delay before the stagger (ms). */
  delay?: number;
  ease?: string;
}

/** On-mount staggered entrance timeline for `[data-animate]` children. */
export function useTimelineReveal<T extends HTMLElement = HTMLDivElement>(
  options: RevealOptions = {}
) {
  const ref = useRef<T>(null);
  const {
    selector = "[data-animate]",
    y = 16,
    duration = 700,
    stagger: step = 70,
    delay = 0,
    ease = "outExpo",
  } = options;

  useIsoLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const targets = Array.from(root.querySelectorAll<HTMLElement>(selector));
    if (targets.length === 0) return;
    if (prefersReducedMotion()) return;

    // Hide synchronously (pre-paint) to avoid a flash before anime loads.
    targets.forEach((t) => {
      t.style.opacity = "0";
      t.style.willChange = "transform, opacity";
    });

    let cancelled = false;
    let anim: { revert?: () => void } | undefined;

    loadAnime().then(({ animate, stagger }) => {
      if (cancelled) {
        targets.forEach((t) => (t.style.opacity = ""));
        return;
      }
      anim = animate(targets, {
        opacity: [0, 1],
        translateY: [y, 0],
        duration,
        delay: stagger(step, { start: delay }),
        ease,
        onComplete: () => targets.forEach((t) => (t.style.willChange = "")),
      });
    });

    return () => {
      cancelled = true;
      anim?.revert?.();
    };
  }, []);

  return ref;
}

/** Scroll-triggered entrance for `[data-reveal]` children via anime onScroll. */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  options: RevealOptions = {}
) {
  const ref = useRef<T>(null);
  const {
    selector = "[data-reveal]",
    y = 24,
    duration = 800,
    ease = "outExpo",
  } = options;

  useIsoLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const targets = Array.from(root.querySelectorAll<HTMLElement>(selector));
    if (targets.length === 0) return;
    if (prefersReducedMotion()) return;

    targets.forEach((t) => (t.style.opacity = "0"));

    let cancelled = false;
    let loaded = false;
    const anims: Array<{ revert?: () => void }> = [];

    loadAnime().then(({ animate, onScroll }) => {
      if (cancelled) {
        targets.forEach((t) => (t.style.opacity = ""));
        return;
      }
      loaded = true;
      // Each target reveals independently as it scrolls into view.
      for (const t of targets) {
        anims.push(
          animate(t, {
            opacity: [0, 1],
            translateY: [y, 0],
            duration,
            ease,
            autoplay: onScroll({ target: t }),
          })
        );
      }
    });

    // Load-failure safety net only — never overrides scroll behaviour.
    const fallback = window.setTimeout(() => {
      if (!cancelled && !loaded) targets.forEach((t) => (t.style.opacity = "1"));
    }, 3000);

    return () => {
      cancelled = true;
      window.clearTimeout(fallback);
      anims.forEach((a) => a.revert?.());
    };
  }, []);

  return ref;
}

/** Pointer-reactive parallax via anime's createAnimatable (smoothed x/y). */
export function useAnimatablePointer<T extends HTMLElement = HTMLDivElement>(
  strength = 14
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    loadAnime().then(({ createAnimatable }) => {
      if (cancelled || !el) return;
      const animatable = createAnimatable(el, { x: 600, y: 600, ease: "out(3)" });
      const onMove = (e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        const dx = ((e.clientX - (r.left + r.width / 2)) / r.width) * strength;
        const dy = ((e.clientY - (r.top + r.height / 2)) / r.height) * strength;
        animatable.x(dx);
        animatable.y(dy);
      };
      window.addEventListener("pointermove", onMove);
      cleanup = () => window.removeEventListener("pointermove", onMove);
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [strength]);

  return ref;
}
