"use client";

// Live AI receptionist demo: a browser voice call to the "AIM Demo Receptionist" Vapi assistant.
// Only the PUBLIC Vapi key reaches the browser (it is locked to our domain in Vapi). Calls are
// capped at 3 minutes by the assistant itself, and at 3 a day per browser here.
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BOOKING_CTA } from "@/lib/site";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY ?? "";
const ASSISTANT_ID = process.env.NEXT_PUBLIC_VAPI_DEMO_ASSISTANT_ID ?? "";
const MAX_SECONDS = 180;
// Shortly before Vapi's hard stop, ask the assistant to wrap up politely.
const WRAP_UP_AT = 155;
const WRAP_UP = "The call ends in about 20 seconds. Briefly thank the caller, remind them the booking link for a free AI Opportunity Call is on this page, and say goodbye.";
const DAILY_LIMIT = 3;
const STORE_KEY = "aim-voice-demo-calls";

type Problem = "mic" | "unsupported" | "limit" | "unavailable" | "failed";
type Status = "idle" | "connecting" | "live" | "ended" | Problem;

type VapiClient = {
  start: (assistantId: string) => Promise<unknown>;
  stop: () => Promise<void>;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  send: (message: { type: "add-message"; message: { role: "system"; content: string }; triggerResponseEnabled?: boolean }) => void;
  removeAllListeners: () => void;
};

const today = () => new Date().toISOString().slice(0, 10);

// Calls used today in this browser. Storage can be blocked (private mode), so fail open.
function callsToday(): number {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) ?? "null") as { day?: string; count?: number } | null;
    return saved?.day === today() ? Number(saved.count) || 0 : 0;
  } catch {
    return 0;
  }
}

function countCall() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({ day: today(), count: callsToday() + 1 }));
  } catch {
    // Storage blocked: nothing to record.
  }
}

const supported = () =>
  typeof window !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia) && "RTCPeerConnection" in window;

const MESSAGES: Record<Problem, string> = {
  mic: "We could not use your microphone. Allow microphone access for this site in your browser settings and try again, or watch the demo video instead.",
  unsupported: "Your browser does not support live voice calls. Try the latest Chrome, Edge or Safari, or watch the demo video instead.",
  limit: `You have used today's ${DAILY_LIMIT} demo calls. Come back tomorrow, or watch the demo video instead.`,
  unavailable: "The live demo is not available right now. Please watch the demo video instead.",
  failed: "The call could not connect. Please try again in a moment, or watch the demo video instead.",
};

const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

export default function VoiceReceptionist({ videoAnchor }: { videoAnchor: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [left, setLeft] = useState(MAX_SECONDS);
  const vapi = useRef<VapiClient | null>(null);

  // Countdown while live, as a guide only: Vapi ends the call at 3 minutes.
  useEffect(() => {
    if (status !== "live") return;
    const started = Date.now();
    const timer = window.setInterval(() => setLeft(Math.max(0, MAX_SECONDS - Math.floor((Date.now() - started) / 1000))), 1000);
    const wrap = window.setTimeout(() => {
      try {
        vapi.current?.send({ type: "add-message", message: { role: "system", content: WRAP_UP }, triggerResponseEnabled: true });
      } catch {
        // The call may already be ending.
      }
    }, WRAP_UP_AT * 1000);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(wrap);
    };
  }, [status]);

  // Hang up if the visitor leaves the page mid-call.
  useEffect(() => () => {
    vapi.current?.stop().catch(() => {});
    vapi.current?.removeAllListeners();
  }, []);

  async function start() {
    if (!PUBLIC_KEY || !ASSISTANT_ID) return setStatus("unavailable");
    if (!supported()) return setStatus("unsupported");
    if (callsToday() >= DAILY_LIMIT) return setStatus("limit");
    setStatus("connecting");
    setLeft(MAX_SECONDS);

    // Ask for the microphone first so a refusal gets a clear message.
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
    } catch (error) {
      const name = (error as { name?: string })?.name;
      return setStatus(name === "NotFoundError" || name === "NotSupportedError" ? "unsupported" : "mic");
    }

    try {
      if (!vapi.current) {
        // Loaded on click so the SDK does not slow down the page.
        const { default: Vapi } = await import("@vapi-ai/web");
        const client = new Vapi(PUBLIC_KEY) as unknown as VapiClient;
        client.on("call-start", () => {
          countCall();
          setStatus("live");
        });
        client.on("call-end", () => setStatus((current) => (current === "connecting" ? "failed" : current === "live" ? "ended" : current)));
        client.on("error", (error) => {
          console.error("Voice demo error", error);
          setStatus((current) => (current === "live" ? "ended" : "failed"));
        });
        vapi.current = client;
      }
      const call = await vapi.current.start(ASSISTANT_ID);
      if (!call) setStatus((current) => (current === "connecting" ? "failed" : current));
    } catch (error) {
      console.error("Voice demo could not start", error);
      setStatus("failed");
    }
  }

  async function end() {
    setStatus("ended");
    await vapi.current?.stop().catch(() => {});
  }

  const problem = status in MESSAGES ? MESSAGES[status as Problem] : "";
  const canRetry = status !== "limit" && status !== "unavailable" && status !== "unsupported";

  return (
    <div className="demo-voice" data-state={status}>
      {(status === "idle" || status === "connecting") && (
        <button type="button" className="demo-try" onClick={start} disabled={status === "connecting"} aria-busy={status === "connecting"}>
          {status === "connecting" ? "Connecting…" : "Start talking"}
        </button>
      )}

      {status === "live" && (
        <div className="voice-live">
          <span className="voice-mic" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="2" width="6" height="12" rx="3" />
              <path d="M5 10a7 7 0 0 0 14 0M12 17v5M8 22h8" />
            </svg>
          </span>
          <span className="voice-live-text">Live: speak now <span className="voice-clock">{clock(left)} left</span></span>
          <button type="button" className="voice-end" onClick={end}>End call</button>
        </div>
      )}

      {status === "ended" && (
        <div className="voice-ended">
          <p><strong>Want this for your business?</strong></p>
          <Link className="demo-try" href={BOOKING_CTA.href}>Book a free call <span aria-hidden="true">→</span></Link>
          {callsToday() < DAILY_LIMIT && <button type="button" className="voice-again" onClick={start}>Talk again</button>}
        </div>
      )}

      {problem && (
        <div className="voice-problem">
          <p>{problem} <a href={`#${videoAnchor}`}>Go to the video</a></p>
          {canRetry && <button type="button" className="voice-again" onClick={start}>Try again</button>}
        </div>
      )}

      <p className="voice-note">Uses your microphone. Calls last up to 3 minutes. Please don&apos;t share personal or confidential information.</p>
      <p className="sr-only" role="status" aria-live="polite">
        {status === "connecting" ? "Connecting the call." : status === "live" ? "Call connected. Speak now." : status === "ended" ? "Call ended." : problem}
      </p>
    </div>
  );
}
