import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col justify-end px-6 pb-16 pt-32 sm:px-12 bg-gradient-to-b from-line via-fog to-fog">
      <h1 className="text-[clamp(4rem,17vw,13rem)] font-extralight leading-[0.9] tracking-tight">
        Grey
        <br />
        Skies
      </h1>
      <p className="mt-8 max-w-md text-lg text-slate">
        A quiet archive of what you wore, kept by date.
      </p>
      <nav className="mt-8 flex gap-3">
        <Link href="/signup" className="btn">
          Sign up
        </Link>
        <Link href="/login" className="btn-quiet inline-flex items-center">
          Log in
        </Link>
      </nav>
    </main>
  );
}
