import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { services } from "./services/data";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "/", "/services/", ...services.map((s) => `/services/${s.slug}/`),
    "/live-demos/", "/about/", "/contact/", "/book-appointment/", "/business-enquiry/", "/instant-quote/",
  ];
  return paths.map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "monthly",
    priority: path === "/" ? 1 : path.startsWith("/services") || path === "/book-appointment/" ? 0.8 : 0.6,
  }));
}
