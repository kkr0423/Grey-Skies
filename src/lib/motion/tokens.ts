import type { CSSProperties } from "react";

// Motion tokens: the single definition shared by CSS and GSAP, the journal
// and Looks (M2+). Starting points — tune here, nowhere else.
// Character: "appear, never bounce".
export const motion = {
  easeStandard: { css: "cubic-bezier(0.22, 1, 0.36, 1)", gsap: "power3.out" },
  easeExit: { css: "cubic-bezier(0.4, 0, 1, 1)", gsap: "power2.in" },
  durMicro: 0.2, // s — hover, buttons
  durBase: 0.6, // s — element reveal
  durEntrance: 0.9, // s — first view of a page or section
  stagger: 0.06, // s — lists and grids
  shiftY: 16, // px — vertical offset on reveal
} as const;

// Exposed as CSS variables on <html> (see app/layout.tsx).
export const motionCssVariables = {
  "--ease-standard": motion.easeStandard.css,
  "--ease-exit": motion.easeExit.css,
  "--dur-micro": `${motion.durMicro}s`,
  "--dur-base": `${motion.durBase}s`,
  "--dur-entrance": `${motion.durEntrance}s`,
  "--stagger": `${motion.stagger}s`,
  "--shift-y": `${motion.shiftY}px`,
} as CSSProperties;

// ScrollTrigger start used by every reveal: a little before the element
// is fully in view.
export const REVEAL_START = "top 90%";

export const NO_REDUCED_MOTION = "(prefers-reduced-motion: no-preference)";
