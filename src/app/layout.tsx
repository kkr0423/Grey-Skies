import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import { motionCssVariables } from "@/lib/motion/tokens";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

// The domain is still undecided: set NEXT_PUBLIC_SITE_URL once it is.
// Until then, Vercel's production URL is used for absolute OGP URLs.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Grey Skies",
    template: "%s — Grey Skies",
  },
  description: "London culture, seen through Hedi Slimane's eyes.",
  openGraph: {
    siteName: "Grey Skies",
    type: "website",
    locale: "en_GB",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} h-full antialiased`}
      style={motionCssVariables}
      // The inline script below adds the "js" class before hydration.
      suppressHydrationWarning
    >
      <head>
        {/* Runs before first paint. Motion start states (hidden) apply only
            under html.js, so content stays visible without JavaScript. */}
        <script
          dangerouslySetInnerHTML={{
            __html: 'document.documentElement.classList.add("js")',
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
