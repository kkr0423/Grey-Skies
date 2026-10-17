import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Images are posted to a server action (Cloudinary secret stays
    // server-side). The 1MB default is too small for a photo.
    serverActions: { bodySizeLimit: "10mb" },
  },
};

export default nextConfig;
