import "server-only";

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { cache } from "react";
import matter from "gray-matter";
import { imageSize } from "image-size";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";

// Articles live in content/journal/YYYY-MM-DD-slug.md; images in
// content/images/ are copied to public/journal-images/ before dev/build
// (scripts/copy-journal-images.mjs).
const JOURNAL_DIR = join(process.cwd(), "content/journal");
const IMAGES_DIR = join(process.cwd(), "content/images");
export const IMAGE_BASE = "/journal-images";

// Drafts are left out of production builds but shown in `next dev`
// so they can be previewed before publishing.
const SHOW_DRAFTS = process.env.NODE_ENV === "development";

export type HeroImage = {
  file: string;
  src: string;
  width: number;
  height: number;
};

export type ArticleMeta = {
  title: string;
  slug: string;
  date: string; // YYYY-MM-DD
  ogDescription: string;
  hero: HeroImage | null;
  draft: boolean;
};

export type Article = ArticleMeta & { html: string };

type Parsed = ArticleMeta & { body: string };

const readAll = cache((): Parsed[] => {
  let files: string[];
  try {
    files = readdirSync(JOURNAL_DIR);
  } catch {
    return [];
  }

  const articles = files
    // Files starting with "_" (e.g. _template.md) are never published.
    .filter((f) => f.endsWith(".md") && !f.startsWith("_"))
    .map((file) => parseFile(file))
    .filter((a) => SHOW_DRAFTS || !a.draft)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  const seen = new Set<string>();
  for (const a of articles) {
    if (seen.has(a.slug)) {
      throw new Error(`Duplicate journal slug "${a.slug}"`);
    }
    seen.add(a.slug);
  }

  return articles;
});

function parseFile(file: string): Parsed {
  const raw = readFileSync(join(JOURNAL_DIR, file), "utf8");
  const { data, content } = matter(raw);
  const where = `content/journal/${file}`;

  const title = requireString(data.title, "title", where);
  const date = toDateString(data.date, where);
  const slug =
    typeof data.slug === "string" && data.slug.trim()
      ? data.slug.trim()
      : file.replace(/^\d{4}-\d{2}-\d{2}-/, "").replace(/\.md$/, "");

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error(`${where}: slug "${slug}" must be lowercase-kebab-case`);
  }

  return {
    title,
    slug,
    date,
    ogDescription:
      typeof data.og_description === "string" ? data.og_description.trim() : "",
    hero: typeof data.hero === "string" && data.hero ? readHero(data.hero, where) : null,
    // Anything other than an explicit `draft: false` stays a draft, so a
    // missing flag can never publish an article by accident.
    draft: data.draft !== false,
    body: content,
  };
}

function requireString(value: unknown, field: string, where: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${where}: frontmatter "${field}" is required`);
  }
  return value.trim();
}

function toDateString(value: unknown, where: string) {
  // YAML parses an unquoted 2026-11-01 as a Date (UTC midnight).
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  throw new Error(`${where}: frontmatter "date" must be YYYY-MM-DD`);
}

function readHero(value: string, where: string): HeroImage {
  // Accept "foo.jpg", "images/foo.jpg" or "../images/foo.jpg".
  const file = value.replace(/^(\.\.\/)?(content\/)?images\//, "");
  let buffer: Buffer;
  try {
    buffer = readFileSync(join(IMAGES_DIR, file));
  } catch {
    throw new Error(`${where}: hero image content/images/${file} not found`);
  }
  const { width, height } = imageSize(buffer);
  return { file, src: `${IMAGE_BASE}/${file}`, width, height };
}

function toMeta(a: Parsed): ArticleMeta {
  return {
    title: a.title,
    slug: a.slug,
    date: a.date,
    ogDescription: a.ogDescription,
    hero: a.hero,
    draft: a.draft,
  };
}

export function getArticles(): ArticleMeta[] {
  return readAll().map(toMeta);
}

export const getArticle = cache(async (slug: string): Promise<Article | null> => {
  const parsed = readAll().find((a) => a.slug === slug);
  if (!parsed) return null;

  const html = String(
    await unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype)
      .use(rehypeStringify)
      .process(rewriteImagePaths(parsed.body)),
  );

  return { ...toMeta(parsed), html };
});

export function readHeroFile(hero: HeroImage) {
  return readFileSync(join(IMAGES_DIR, hero.file));
}

// Body images are written relative to the article (../images/foo.jpg) so
// they preview in an editor; rewrite them to the served path.
function rewriteImagePaths(markdown: string) {
  return markdown.replace(
    /(\]\()(?:\.\.\/)?images\//g,
    `$1${IMAGE_BASE}/`,
  );
}

export function formatDate(day: string) {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
