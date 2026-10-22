import type { NextConfig } from "next";

// Static export for GitHub Pages: `next build` writes plain HTML/CSS/JS to `out/`.
// There is no server, so the site cannot use API routes, server actions or
// request-time features such as headers() or cookies().

// PAGES_PREVIEW=true builds for https://aidemolab.github.io/aim-smart-solutions/.
// Without it, the build is for the domain root (aimsmartsolutions.tech).
const basePath = process.env.PAGES_PREVIEW === "true" ? "/aim-smart-solutions" : "";

const nextConfig: NextConfig = {
  output: "export",
  // Pages serves /about/ as /about/index.html, so every route gets its own folder.
  trailingSlash: true,
  // The image optimiser needs a server.
  images: { unoptimized: true },
  basePath,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
