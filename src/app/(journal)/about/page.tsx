import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "What Grey Skies is, and how it is written.",
};

// Placeholder copy: the owner writes the final version. The AI-use
// disclosure is required before the first article goes out.
export default function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 pt-16 sm:px-10">
      <h1 className="text-[clamp(2.5rem,7vw,4.5rem)] font-extralight leading-[1.02] tracking-tight">
        About
      </h1>
      <div className="article-body mt-10">
        <p>
          Grey Skies looks at London culture (the clothes, the music, the
          rooms and the people in them) through Hedi Slimane&apos;s eyes:
          overcast, monochrome, drawn in thin lines.
        </p>
        <h2>How it is written</h2>
        <p>
          Every piece is chosen, edited and signed off by the editor. Research,
          outlines, first drafts and English proofreading are done with the
          help of AI (Claude). Facts are checked before anything is published,
          and the final voice is always the editor&apos;s.
        </p>
      </div>
    </main>
  );
}
