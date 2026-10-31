import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArticleBody } from "@/components/motion/article-body";
import { formatDate, getArticle, getArticles } from "@/lib/journal";

// Only articles that exist at build time are served; anything else is 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return getArticles().map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/journal/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return {};

  return {
    title: article.title,
    description: article.ogDescription || undefined,
    alternates: { canonical: `/journal/${article.slug}` },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.ogDescription || undefined,
      publishedTime: article.date,
      url: `/journal/${article.slug}`,
    },
    // Drafts only render in `next dev`, but never let one be indexed.
    robots: article.draft ? { index: false, follow: false } : undefined,
  };
}

export default async function ArticlePage({
  params,
}: PageProps<"/journal/[slug]">) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();

  return (
    <main className="flex-1">
      <article>
        <header className="mx-auto w-full max-w-3xl px-6 pt-16 sm:px-10">
          <p className="label text-slate">
            <time dateTime={article.date}>{formatDate(article.date)}</time>
            {article.draft && (
              <span className="ml-3">Draft</span>
            )}
          </p>
          <h1 className="mt-4 text-[clamp(2.5rem,7vw,4.5rem)] font-extralight leading-[1.02] tracking-tight">
            {article.title}
          </h1>
          {article.ogDescription && (
            <p className="mt-6 text-xl font-light text-slate">
              {article.ogDescription}
            </p>
          )}
        </header>

        {article.hero && (
          <figure className="mx-auto mt-12 w-full max-w-5xl sm:px-10">
            <Image
              src={article.hero.src}
              width={article.hero.width}
              height={article.hero.height}
              alt=""
              sizes="(min-width: 1024px) 64rem, 100vw"
              loading="eager"
              fetchPriority="high"
              className="mono h-auto w-full bg-cloud"
            />
          </figure>
        )}

        <ArticleBody
          html={article.html}
          className="article-body mx-auto mt-12 w-full max-w-3xl px-6 sm:px-10"
        />
      </article>
    </main>
  );
}
