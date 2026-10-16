import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  // react-pdf only runs in the browser (proposal dialog), but the client
  // component is also server-rendered, so Next traces it as an external
  // package; OpenNext symlinks externals, which fails on Windows. Bundling
  // it avoids the external (the code is never executed on the Worker).
  transpilePackages: ["@react-pdf/renderer"],
};

export default nextConfig;

// Lets `next dev` read the D1 binding from wrangler.jsonc (local D1 in .wrangler/).
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
