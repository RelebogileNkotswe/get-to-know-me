import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Photos are cropped and compressed in the browser first, but the server accepts up to the 5 MB photo limit
      // plus the rest of the form, and then checks and compresses the image again.
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
