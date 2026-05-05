import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  experimental: {
    serverActions: {
      // Default is 1 MB; design references can be a few MB screenshots.
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
