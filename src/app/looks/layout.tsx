import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Looks", template: "%s — Grey Skies Looks" },
  description: "A quiet archive of what you wore, kept by date.",
};

export default function LooksLayout({ children }: LayoutProps<"/looks">) {
  return children;
}
