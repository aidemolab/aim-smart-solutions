"use client";

import { useEffect, useRef } from "react";

// Cloudflare Turnstile CAPTCHA. Calls onToken with a fresh token, or "" when it
// expires or fails. Tokens are single-use: change resetKey after each submission.
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type TurnstileApi = {
  render(container: HTMLElement, options: Record<string, unknown>): string;
  remove(widgetId: string): void;
};

declare global {
  interface Window { turnstile?: TurnstileApi }
}

let scriptPromise: Promise<void> | null = null;
function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  scriptPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => { scriptPromise = null; reject(new Error("Turnstile failed to load")); };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export default function Turnstile({ onToken, resetKey }: { onToken: (token: string) => void; resetKey: number }) {
  const container = useRef<HTMLDivElement>(null);
  const callback = useRef(onToken);
  useEffect(() => { callback.current = onToken; }, [onToken]);

  useEffect(() => {
    if (!SITE_KEY || !container.current) return;
    let widgetId: string | null = null;
    let cancelled = false;
    loadScript().then(() => {
      if (cancelled || !container.current || !window.turnstile) return;
      widgetId = window.turnstile.render(container.current, {
        sitekey: SITE_KEY,
        callback: (token: string) => callback.current(token),
        "expired-callback": () => callback.current(""),
        "error-callback": () => callback.current(""),
      });
    }, () => callback.current(""));
    return () => {
      cancelled = true;
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, [resetKey]);

  if (!SITE_KEY) return null;
  return <div ref={container} className="turnstile-widget" style={{ margin: "0 0 20px", minHeight: 65 }} />;
}
