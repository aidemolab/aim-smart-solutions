"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

// Every new page opens at the very top. Next.js keeps the old scroll position when the top of the
// new page is still partly in view (after a small scroll), which hid the breadcrumb under the
// sticky header. Links to an #anchor and the browser's Back/Forward buttons are left alone, so
// anchors still land and Back still returns to where the visitor was.
let fromHistory = false;

export default function ScrollToTop() {
  const pathname = usePathname();
  const first = useRef(true);

  useEffect(() => {
    const onPopState = () => { fromHistory = true; };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (fromHistory) { fromHistory = false; return; }
    if (window.location.hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}
