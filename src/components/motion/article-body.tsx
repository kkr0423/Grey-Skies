"use client";

import { useRef } from "react";
import { gsap, SplitText, useGSAP } from "@/lib/motion/gsap";
import { motion, NO_REDUCED_MOTION, REVEAL_START } from "@/lib/motion/tokens";
import { revealOnEnter } from "./reveal";

/**
 * Article body with scroll reveals. Running text never moves: only section
 * headings (line by line, via SplitText) and set-pieces (quotes, images,
 * rules) appear as they enter. Selectors match the CSS start state in
 * globals.css.
 */
export function ArticleBody({ html, className }: { html: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add(NO_REDUCED_MOTION, () => {
        revealOnEnter(Array.from(el.querySelectorAll(":scope > :is(blockquote, hr, p:has(> img))")));

        el.querySelectorAll<HTMLElement>(":scope > h2").forEach((heading) => {
          SplitText.create(heading, {
            type: "lines",
            // Re-split after web fonts load or on resize, so line breaks
            // stay right.
            autoSplit: true,
            onSplit(self) {
              gsap.set(heading, { opacity: 1 });
              return gsap.from(self.lines, {
                opacity: 0,
                y: motion.shiftY,
                duration: motion.durBase,
                ease: motion.easeStandard.gsap,
                stagger: motion.stagger,
                scrollTrigger: { trigger: heading, start: REVEAL_START, once: true },
              });
            },
          });
        });
      });
    },
    { scope: ref },
  );

  return (
    <div
      ref={ref}
      data-motion=""
      className={className}
      // Trusted: Markdown from this repo, rendered at build time.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
