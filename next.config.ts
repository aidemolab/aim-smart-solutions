import type { NextConfig } from "next";

// Static export for GitHub Pages: `next build` writes plain HTML/CSS/JS to `out/`.
// There is no server, so the site cannot use API routes, server actions or
// request-time features such as headers() or cookies().
const nextConfig: NextConfig = {
  output: "export",
  // Pages serves /about/ as /about/index.html, so every route gets its own folder.
  trailingSlash: true,
  // The image optimiser needs a server.
  images: { unoptimized: true },
};

export default nextConfig;
