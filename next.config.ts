import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Images are posted to a server action (Cloudinary secret stays
    // server-side). The 1MB default is too small for a photo.
    serverActions: { bodySizeLimit: "10mb" },
  },
  images: {
    // Journal images only (copied from content/images/ at build time).
    localPatterns: [{ pathname: "/journal-images/**", search: "" }],
  },
  // Looks moved under /looks. Keep old links and in-flight confirmation
  // emails working.
  async redirects() {
    return [
      { source: "/archive", destination: "/looks/archive", permanent: false },
      { source: "/login", destination: "/looks/login", permanent: false },
      { source: "/signup", destination: "/looks/signup", permanent: false },
    ];
  },
};

export default nextConfig;
