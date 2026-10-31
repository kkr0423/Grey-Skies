"use client";

// The one place GSAP plugins are registered. Import gsap and plugins from
// here, never from "gsap" directly, so registration always happens first.
// Allowed plugins: ScrollTrigger, SplitText (Flip is an M4+ idea).
// Not used: ScrollSmoother, MorphSVG, CustomBounce, CustomWiggle.
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

export { gsap, ScrollTrigger, SplitText, useGSAP };
