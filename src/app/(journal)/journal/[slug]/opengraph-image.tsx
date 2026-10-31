import { ImageResponse } from "next/og";
import { getArticle, getArticles, readHeroFile } from "@/lib/journal";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Grey Skies";

export function generateStaticParams() {
  return getArticles().map((a) => ({ slug: a.slug }));
}

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
};

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticle(slug);

  // ImageResponse can embed JPEG/PNG only; other hero formats fall back
  // to the plain grey card.
  let hero: string | null = null;
  const ext = article?.hero?.file.split(".").pop()?.toLowerCase() ?? "";
  if (article?.hero && MIME[ext]) {
    hero = `data:${MIME[ext]};base64,${readHeroFile(article.hero).toString("base64")}`;
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "#1c2227",
          color: "#f1f2f3",
        }}
      >
        {hero && (
          <img
            src={hero}
            alt=""
            width={1200}
            height={630}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "grayscale(100%)",
            }}
          />
        )}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "56px 64px",
            background: hero
              ? "linear-gradient(to top, rgba(18,22,26,0.85) 0%, rgba(18,22,26,0.15) 60%)"
              : "transparent",
          }}
        >
          <div style={{ fontSize: 28, letterSpacing: 2, opacity: 0.85 }}>
            GREY SKIES
          </div>
          <div
            style={{
              fontSize: 68,
              lineHeight: 1.05,
              letterSpacing: -1.5,
              maxWidth: 1000,
            }}
          >
            {article?.title ?? "Grey Skies"}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
