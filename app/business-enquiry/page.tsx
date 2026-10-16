"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

type SubmissionState = "ready" | "submitting" | "success" | "error";

export default function BusinessEnquiryPage() {
  const [state, setState] = useState<SubmissionState>("ready");
  const [message, setMessage] = useState("");

  async function submitEnquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "submitting") return;
    const data = new FormData(event.currentTarget);
    setState("submitting");
    const urgency = data.get("urgency");
    setMessage("");

    try {
      const response = await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: data.get("firstName"),
          businessName: data.get("businessName"),
          email: data.get("email"),
          phone: data.get("mobile"),
          enquiry: data.get("enquiry"),
          urgency,
        }),
      });
      const result = (await response.json().catch(() => null)) as { ok?: boolean; callId?: string; message?: string } | null;
      if (response.ok && result?.ok) {
        setState("success");
        setMessage(urgency === "urgent"
          ? "Thank you. Your urgent enquiry has been submitted and our AI assistant is calling you now."
          : "Thank you. Your enquiry has been submitted and we will get back to you within 24 hours.");
        return;
      }
      setState("error");
      setMessage(result?.message || "We could not start the call. Please check your mobile number and try again.");
    } catch {
      setState("error");
      setMessage("We could not contact the call service. Please try again.");
    }
  }

  return (
    <main id="top">
      <header className="site-header">
        <Link className="brand" href="/" aria-label="AIM Smart Solutions home"><img src="/aim-smart-solutions-logo.png" alt="AIM Smart Solutions — Business Growth & Automation" /></Link>
        <nav aria-label="Main navigation"><Link href="/#outcomes">Outcomes</Link><Link href="/#solutions">Solutions</Link><Link href="/#proof">Proof</Link><Link href="/instant-quote">Request a Proposal</Link><Link href="/#about">Why AIM</Link></nav>
        <Link className="nav-cta" href="/book-appointment">Book your free call</Link>
      </header>

      <section className="section enquiry-page" aria-labelledby="enquiry-title">
        <div className="enquiry-copy">
          <p className="kicker">Live Working Demonstration</p>
          <h1 id="enquiry-title">Experience a faster <em>enquiry response.</em></h1>
          <p>This working demonstration shows how a business can capture an enquiry, confirm it immediately and offer an optional AI voice response for urgent requests.</p>
          <ol className="demo-flow" aria-label="What happens next">
            <li><span>1</span>Tell us what you need</li>
            <li><span>2</span>Submit your enquiry</li>
            <li><span>3</span>Receive a call if your enquiry is urgent</li>
          </ol>
        </div>
        <form className="contact-form enquiry-form" onSubmit={submitEnquiry}>
          <div className="form-row">
            <label htmlFor="first-name">First Name<input id="first-name" name="firstName" type="text" autoComplete="given-name" required /></label>
            <label htmlFor="business-name">Business Name<input id="business-name" name="businessName" type="text" autoComplete="organization" required /></label>
          </div>
          <label htmlFor="email-address">Email Address<input id="email-address" name="email" type="email" autoComplete="email" required /></label>
          <label htmlFor="mobile-number">Mobile Number<input id="mobile-number" name="mobile" type="tel" inputMode="tel" autoComplete="tel" placeholder="Enter your UK mobile number" aria-describedby="mobile-help enquiry-status" required /></label>
          <p className="field-help" id="mobile-help">Enter a UK mobile number beginning 07 or +44 7.</p>
          <label htmlFor="enquiry">Your Enquiry<textarea id="enquiry" name="enquiry" rows={7} required /></label>
          <fieldset className="urgency-field" style={{ margin: "0 0 12px", padding: 0, border: 0 }}>
            <legend style={{ marginBottom: 12, color: "var(--navy-2)", fontSize: 10, fontWeight: 800, letterSpacing: ".11em", textTransform: "uppercase" }}>How urgent is your enquiry?</legend>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 9, margin: "0 28px 0 0", fontSize: 14, letterSpacing: 0, textTransform: "none", cursor: "pointer" }}><input style={{ width: 18, height: 18, margin: 0 }} name="urgency" type="radio" value="normal" defaultChecked /> Normal</label>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 9, margin: 0, fontSize: 14, letterSpacing: 0, textTransform: "none", cursor: "pointer" }}><input style={{ width: 18, height: 18, margin: 0 }} name="urgency" type="radio" value="urgent" /> Urgent</label>
          </fieldset>
          <p className="field-help urgency-help" style={{ margin: "0 0 24px" }}>Select Urgent if you need a prompt response. Our AI assistant will call the mobile number you provided.</p>
          <button type="submit" disabled={state === "submitting"}>{state === "submitting" ? "Submitting…" : "Try the enquiry journey"}<span>→</span></button>
          {message && <p id="enquiry-status" className={`submission-message ${state}`} role="status" aria-live="polite">{message}</p>}
        </form>
      </section>

      <section className="demo-benefits" aria-labelledby="demo-benefits-title">
        <div>
          <p className="kicker">What happens next</p>
          <h2 id="demo-benefits-title">A faster response to your enquiry.</h2>
        </div>
        <div className="benefit-grid">
          <article><span>01</span><h3>Tell us about your business</h3><p>Share your contact details and a short description of the support you need.</p></article>
          <article><span>02</span><h3>We review your enquiry</h3><p>For normal enquiries, we will get back to you within 24 hours.</p></article>
          <article><span>03</span><h3>Urgent support</h3><p>If you select Urgent, our AI assistant will also call the UK mobile number you provide.</p></article>
        </div>
      </section>

      <footer>
        <Link className="footer-brand" href="/"><img src="/aim-smart-solutions-logo.png" alt="AIM Smart Solutions" /></Link>
        <p>Practical AI and automation that helps service businesses win more opportunities, serve customers faster and release capacity for growth.</p>
        <nav aria-label="Footer navigation"><Link href="/#outcomes">Outcomes</Link><Link href="/#solutions">Solutions</Link><Link href="/#proof">Proof</Link><Link href="/instant-quote">Request a proposal</Link><Link href="/book-appointment">Book a free call</Link></nav>
        <small>© {new Date().getFullYear()} AIM Smart Solutions. All rights reserved.</small>
      </footer>
    </main>
  );
}
