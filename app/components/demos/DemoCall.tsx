"use client";

// AI receptionist demo: a button in the demo card opens a small pop-up asking for a
// first name and UK mobile. The demo-call Supabase function checks Turnstile and the
// limits, then asks Vapi to phone the visitor. No Vapi key is in the browser.
import { FormEvent, useRef, useState } from "react";
import { DEMO_CALL_CONSENT } from "@/lib/demos";
import { callFunction, HONEYPOT_FIELD, toUkE164 } from "@/lib/supabase-functions";
import Turnstile from "../Turnstile";

type State = "ready" | "sending" | "done" | "error";

export default function DemoCall() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [state, setState] = useState<State>("ready");
  const [message, setMessage] = useState("");
  const [token, setToken] = useState("");
  const [turnstileKey, setTurnstileKey] = useState(0);

  function open() {
    if (state === "done") setState("ready");
    setMessage("");
    dialog.current?.showModal();
  }

  function fail(text: string) {
    setState("error");
    setMessage(text);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "sending") return;
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const mobile = toUkE164(data.get("mobile"));
    if (!name) return fail("Please enter your first name.");
    if (!mobile) return fail("Please enter a UK mobile number starting 07 or +44 7.");
    if (data.get("consent") !== "yes") return fail("Please tick the box to agree to the demo call.");
    if (!token) return fail("Please complete the security check.");
    setState("sending");
    setMessage("");
    const { result } = await callFunction("demo-call", {
      name,
      mobile,
      consent: true,
      turnstileToken: token,
      [HONEYPOT_FIELD]: String(data.get(HONEYPOT_FIELD) ?? ""),
    });
    // Turnstile tokens are single-use: get a fresh one for any retry.
    setToken("");
    setTurnstileKey((key) => key + 1);
    if (result?.ok) {
      setState("done");
      setMessage("Your phone will ring in a few seconds.");
    } else {
      fail(result?.message || "We could not place the call just now. Please try again later.");
    }
  }

  return (
    <div className="demo-call">
      <button type="button" className="demo-try" onClick={open} aria-haspopup="dialog">
        Try it now: get a call from our AI receptionist
      </button>
      <p className="demo-call-note">One call per number per day. Calls last up to 3 minutes. Please don&apos;t share personal or confidential information.</p>

      <dialog ref={dialog} className="demo-call-dialog" aria-labelledby="demo-call-title" onClose={() => state === "error" && setState("ready")}>
        <button type="button" className="demo-call-close" onClick={() => dialog.current?.close()} aria-label="Close">×</button>
        <h3 id="demo-call-title">Get a call from our AI receptionist</h3>
        {state === "done" ? (
          <div className="demo-call-done" role="status" aria-live="polite">
            <p className="demo-call-ring">{message}</p>
            <p>Answer it and ask whatever you like: what AIM does, which service fits, or how the free call works.</p>
            <button type="button" className="demo-try" onClick={() => dialog.current?.close()}>Close</button>
          </div>
        ) : (
          <form className="contact-form demo-call-form" onSubmit={submit} noValidate>
            <label htmlFor="demo-call-name">First name<input id="demo-call-name" name="name" type="text" autoComplete="given-name" maxLength={30} required /></label>
            <label htmlFor="demo-call-mobile">UK mobile number<input id="demo-call-mobile" name="mobile" type="tel" inputMode="tel" autoComplete="tel" placeholder="07…" aria-describedby="demo-call-status" required /></label>
            <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }}>
              <label htmlFor="demo-call-website">Website<input id="demo-call-website" name={HONEYPOT_FIELD} type="text" tabIndex={-1} autoComplete="off" /></label>
            </div>
            <label htmlFor="demo-call-consent" className="demo-call-consent"><input id="demo-call-consent" name="consent" type="checkbox" value="yes" required /> {DEMO_CALL_CONSENT}</label>
            <Turnstile onToken={setToken} resetKey={turnstileKey} />
            <button type="submit" disabled={state === "sending"}>{state === "sending" ? "Calling…" : "Call me now"}<span aria-hidden="true">→</span></button>
            <p id="demo-call-status" className={`submission-message ${state}`} role="status" aria-live="polite">{message}</p>
          </form>
        )}
      </dialog>
    </div>
  );
}
