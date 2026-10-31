import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { SignupForm } from "@/components/signup-form";

export default function JournalLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <header className="border-b border-ink">
        <div className="mx-auto flex w-full max-w-5xl items-baseline justify-between px-6 py-5 sm:px-10">
          <Link href="/" className="label">
            Grey Skies
          </Link>
          <nav className="label flex gap-6 text-slate">
            <Link href="/" className="nav-link">
              Journal
            </Link>
            <Link href="/about" className="nav-link">
              About
            </Link>
          </nav>
        </div>
      </header>

      <div className="flex flex-1 flex-col">{children}</div>

      <footer className="mt-24 border-t border-ink">
        <Reveal className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-12 sm:px-10">
          <p className="text-2xl font-light tracking-tight">
            Grey Skies Looks — coming soon
          </p>
          <SignupForm id="footer-signup" />
        </Reveal>
      </footer>
    </>
  );
}
