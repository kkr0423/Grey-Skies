import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { formatDate, getArticles } from "@/lib/journal";

export default function JournalIndex() {
  const articles = getArticles();
  const [lead, ...rest] = articles;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 pt-16 sm:px-10">
      <h1 className="text-[clamp(3.5rem,14vw,10rem)] font-extralight leading-[0.9] tracking-tight">
        Grey
        <br />
        Skies
      </h1>
      <p className="mt-6 max-w-md text-lg text-slate">
        London culture, seen through Hedi Slimane&apos;s eyes.
      </p>

      {!lead ? (
        <p className="mt-24 text-slate">The first piece is on its way.</p>
      ) : (
        <>
          <article className="mt-20 border-t border-ink pt-10">
            <Link href={`/journal/${lead.slug}`} className="group block">
              {lead.hero && (
                <Image
                  src={lead.hero.src}
                  width={lead.hero.width}
                  height={lead.hero.height}
                  alt=""
                  sizes="(min-width: 1024px) 64rem, 100vw"
                  // First article image is the likely LCP element.
                  loading="eager"
                  fetchPriority="high"
                  className="mono h-auto w-full bg-cloud"
                />
              )}
              <ArticleText article={lead} large />
            </Link>
          </article>

          {rest.length > 0 && (
            <Reveal
              as="ul"
              group
              className="mt-16 grid gap-x-10 gap-y-14 border-t border-ink pt-10 sm:grid-cols-2"
            >
              {rest.map((article) => (
                <li key={article.slug}>
                  <Link href={`/journal/${article.slug}`} className="group block">
                    {article.hero && (
                      <Image
                        src={article.hero.src}
                        width={article.hero.width}
                        height={article.hero.height}
                        alt=""
                        sizes="(min-width: 640px) 50vw, 100vw"
                        className="mono h-auto w-full bg-cloud"
                      />
                    )}
                    <ArticleText article={article} />
                  </Link>
                </li>
              ))}
            </Reveal>
          )}
        </>
      )}
    </main>
  );
}

function ArticleText({
  article,
  large = false,
}: {
  article: ReturnType<typeof getArticles>[number];
  large?: boolean;
}) {
  return (
    <div className="mt-5">
      <p className="label text-slate">
        <time dateTime={article.date}>{formatDate(article.date)}</time>
        {article.draft && <span className="ml-3">Draft</span>}
      </p>
      <h2
        className={`mt-2 font-light tracking-tight group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4 ${
          large ? "text-4xl sm:text-5xl" : "text-2xl"
        }`}
      >
        {article.title}
      </h2>
      {article.ogDescription && (
        <p className="mt-3 max-w-xl text-slate">{article.ogDescription}</p>
      )}
    </div>
  );
}
