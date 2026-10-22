// The site normally lives at the domain root. For the GitHub Pages preview it
// lives under /aim-smart-solutions, set at build time by next.config.ts.
// next/link adds the prefix itself; plain <img src> and <a href> need this helper.
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function withBase(path: string): string {
  return path.startsWith("/") && !path.startsWith("//") ? `${basePath}${path}` : path;
}
