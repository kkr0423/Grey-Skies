import Link from "next/link";
import { SignupForm } from "@/components/signup-form";

// Looks is built (M1) but not open yet. /looks/login and /looks/archive
// still work by direct URL for the owner.
export default function LooksComingSoon() {
  return (
    <main className="flex flex-1 flex-col justify-end bg-gradient-to-b from-line via-fog to-fog px-6 pb-16 pt-32 sm:px-12">
      <p className="label text-slate">Coming soon</p>
      <h1 className="mt-4 text-[clamp(3.5rem,14vw,10rem)] font-extralight leading-[0.9] tracking-tight">
        Grey Skies
        <br />
        Looks
      </h1>
      <p className="mt-8 max-w-md text-lg text-slate">
        A quiet archive of what you wore, kept by date.
      </p>
      <div className="mt-10">
        <SignupForm id="looks-signup" />
      </div>
      <p className="mt-16 text-sm text-slate">
        <Link href="/" className="link">
          Read the journal
        </Link>
      </p>
    </main>
  );
}
