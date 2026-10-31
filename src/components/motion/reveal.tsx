"use client";

import { useRef, type ElementType, type ReactNode } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/motion/gsap";
import { motion, NO_REDUCED_MOTION, REVEAL_START } from "@/lib/motion/tokens";

type RevealProps = {
  as?: ElementType;
  /** Reveal each direct child as it enters, staggered (lists, grids). */
  group?: boolean;
  className?: string;
  children: ReactNode;
};

/**
 * Fades content in and lifts it by --shift-y once, when it enters the
 * viewport. The hidden start state is set in CSS under `html.js` and only
 * when reduced motion is not requested, so without JS or with reduced
 * motion the content is simply there.
 *
 * Never wrap the LCP element (page title, first hero image).
 */
export function Reveal({ as: Tag = "div", group = false, className, children }: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add(NO_REDUCED_MOTION, () => {
        revealOnEnter(group ? Array.from(el.children) : [el]);
      });
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref} className={className} {...(group ? { "data-reveal-group": "" } : { "data-reveal": "" })}>
      {children}
    </Tag>
  );
}

/** Shared by Reveal and the article body. Plays once per element. */
export function revealOnEnter(targets: Element[]) {
  if (targets.length === 0) return;
  // Start from the CSS state (opacity 0, translateY(--shift-y)).
  gsap.set(targets, { opacity: 0, y: motion.shiftY });
  ScrollTrigger.batch(targets, {
    start: REVEAL_START,
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, {
        opacity: 1,
        y: 0,
        duration: motion.durBase,
        ease: motion.easeStandard.gsap,
        stagger: motion.stagger,
        overwrite: true,
      }),
  });
}
