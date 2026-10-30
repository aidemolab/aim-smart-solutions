"use client";

import { useEffect } from "react";
import { withBase } from "@/lib/base-path";

// Sends the visitor on to `to` straight away (GitHub Pages has no server redirects). An old
// "#demos-<service>" anchor becomes "#service-<service>" on the new page.
export default function RedirectTo({ to }: { to: string }) {
  useEffect(() => {
    const hash = window.location.hash.replace(/^#demos-/, "#service-");
    window.location.replace(withBase(to) + hash);
  }, [to]);
  return null;
}
