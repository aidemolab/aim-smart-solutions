"use client";

import ContactCrumbs from "../components/ContactCrumbs";
import { FormEvent, useMemo, useRef, useState } from "react";
import FieldError from "../components/FieldError";
import { checkFields, fieldProps, focusFirstError, type FieldErrors } from "@/lib/form-errors";
import PrivacyNote from "../components/PrivacyNote";
import { callFunction, HONEYPOT_FIELD, toUkE164 } from "@/lib/supabase-functions";
import { pillars } from "@/lib/site";
import { serviceBySlug } from "../services/data";
import "./quote.css";

// The nine services, grouped by pillar, plus "Not sure yet". Their names go into the quote
// emails as they appear here; save-service-request accepts all 10.
const NOT_SURE = { id: "not-sure", name: "Not sure yet / something else" };
const groups = pillars.map((pillar) => ({
  name: pillar.name,
  services: pillar.services.map((slug) => ({ id: slug, name: serviceBySlug(slug)?.name ?? slug })),
}));
const services = [...groups.flatMap((group) => group.services), NOT_SURE];

type SubmissionState = "ready" | "submitting" | "success" | "error";

export default function InstantQuotePage() {
  const [selected, setSelected] = useState<string[]>([]);
  const [details, setDetails] = useState<Record<string, string>>({});
  const [activeIndex, setActiveIndex] = useState(0);
  const [state, setState] = useState<SubmissionState>("ready");
  const [message, setMessage] = useState("");
  const [customer, setCustomer] = useState({ name: "", business: "", email: "", mobile: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const formRef = useRef<HTMLFormElement>(null);
  const chosen = useMemo(() => services.filter((service) => selected.includes(service.id)), [selected]);
  const activeService = chosen[activeIndex];

  function toggle(id: string) {
    setState("ready");
    setMessage("");
    setSelected((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      setActiveIndex((index) => Math.min(index, Math.max(next.length - 1, 0)));
      return next;
    });
  }

  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "submitting") return;
    const found = checkFields(customer, [
      { name: "name", empty: "Enter your full name." },
      { name: "business", empty: "Enter your business name." },
      { name: "email", empty: "Enter your email address.", kind: "email" },
      { name: "mobile", empty: "Enter your UK mobile number.", kind: "mobile" },
    ]);
    if (chosen.length === 0) found.services = `Tick at least one service, or “${NOT_SURE.name}”.`;
    const missing = chosen.findIndex((service) => !details[service.id]?.trim());
    if (missing >= 0) { found.details = `Describe what you would like help with for ${chosen[missing].name}.`; setActiveIndex(missing); }
    setErrors(found);
    const mobile = toUkE164(customer.mobile);
    if (Object.keys(found).length || !mobile) {
      setState("ready");
      setMessage("");
      // The details box may only appear after this render, so focus on the next frame.
      requestAnimationFrame(() => focusFirstError(formRef.current, found));
      return;
    }
    setState("submitting");
    setMessage("");
    try {
      const { status, result } = await callFunction("save-service-request", {
        name: customer.name.trim(),
        businessName: customer.business.trim(),
        email: customer.email.trim().toLowerCase(),
        mobile,
        services: chosen.map((service) => ({ id: service.id, name: service.name, details: details[service.id].trim() })),
        website: String(new FormData(event.currentTarget).get(HONEYPOT_FIELD) ?? ""),
      });
      if (status >= 400 || !result?.ok) throw new Error(result?.message || "Your request could not be submitted.");
      setState("success");
      setMessage("Thank you. We have received your service request and will contact you within 24 hours.");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Your request could not be submitted. Please try again.");
    }
  }

  return (
    <main id="main">
      <section className="quote-hero">
        <ContactCrumbs name="Request a quote" path="/instant-quote/" />
        <h1>Tell us the outcome your business needs.</h1>
        <p>If you already have a defined requirement, select the relevant support and describe the result you want. We will review it and contact you within 24 hours.</p>
      </section>

      <form ref={formRef} className="quote-builder" aria-label="Service request form" onSubmit={submitRequest} noValidate>
        <div className="quote-form-panel">
          <div className="quote-step"><span>01</span><div><h2>Your details</h2><p>Tell us who the service request is for.</p></div></div>
          <div className="quote-fields">
            <div className="field"><label>Full name<input required name="name" value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} placeholder="Your name" autoComplete="name" {...fieldProps("name", errors)} /></label><FieldError name="name" errors={errors} /></div>
            <div className="field"><label>Business name<input required name="business" value={customer.business} onChange={(e) => setCustomer({ ...customer, business: e.target.value })} placeholder="Your business" autoComplete="organization" {...fieldProps("business", errors)} /></label><FieldError name="business" errors={errors} /></div>
            <div className="field"><label>Email address<input required name="email" type="email" value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} placeholder="name@business.co.uk" autoComplete="email" {...fieldProps("email", errors)} /></label><FieldError name="email" errors={errors} /></div>
            <div className="field"><label>Mobile number<input required name="mobile" type="tel" inputMode="tel" value={customer.mobile} onChange={(e) => setCustomer({ ...customer, mobile: e.target.value })} placeholder="07 or +44 7" autoComplete="tel" {...fieldProps("mobile", errors)} /></label><FieldError name="mobile" errors={errors} /></div>
            <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }}><label htmlFor="quote-website">Website<input id="quote-website" name={HONEYPOT_FIELD} type="text" tabIndex={-1} autoComplete="off" /></label></div>
          </div>

          <div className="quote-step service-step"><span>02</span><div><h2>Select the support you may need</h2><p>Not sure which fits? Choose “{NOT_SURE.name}” or book a free call first.</p></div></div>
          <FieldError name="services" errors={errors} />
          {[...groups, { name: "Something else", services: [NOT_SURE] }].map((group) => (
            <fieldset className="quote-service-group" key={group.name}>
              <legend>{group.name}</legend>
              <div className="quote-services">
                {group.services.map((service) => {
                  const isOn = selected.includes(service.id);
                  return (
                    <label className={isOn ? "selected" : ""} key={service.id}>
                      <input type="checkbox" checked={isOn} onChange={() => toggle(service.id)} {...(service.id === services[0].id ? fieldProps("services", errors) : { "aria-describedby": errors.services ? "services-error" : undefined })} />
                      <span><strong>{service.name}</strong></span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>

        <aside className="service-details-panel" aria-live="polite">
          {state === "success" ? (
            <div className="request-success"><span>✓</span><h2>Request received</h2><p>{message}</p><small>A confirmation email has been sent to {customer.email}.</small></div>
          ) : !activeService ? (
            <div className="quote-placeholder"><h2>Describe what you need</h2><p>Tick at least one service and a box appears here for each one, so you can describe the result you want.</p></div>
          ) : (
            <div className="service-detail-step">
              <p className="detail-progress">Service {activeIndex + 1} of {chosen.length}</p>
              <h2>{activeService.name}</h2>
              <label htmlFor={`details-${activeService.id}`}>What would you like help with?</label>
              <textarea id={`details-${activeService.id}`} required rows={9} value={details[activeService.id] || ""} onChange={(e) => setDetails({ ...details, [activeService.id]: e.target.value })} placeholder="What you need, the current problem and the outcome you would like." {...fieldProps("details", errors)} />
              <FieldError name="details" errors={errors} />
              <div className="detail-actions">
                <button type="button" className="back-button" disabled={activeIndex === 0} onClick={() => setActiveIndex(activeIndex - 1)}>Previous</button>
                {activeIndex < chosen.length - 1 && (
                  <button type="button" className="next-button" onClick={() => setActiveIndex(activeIndex + 1)}>Next service →</button>
                )}
              </div>
            </div>
          )}
          {state !== "success" && <>
            <button type="submit" className="submit-request quote-submit" disabled={state === "submitting"}>{state === "submitting" ? "Sending…" : "Send my quote request"}</button>
            {Object.keys(errors).length > 0 && <p className="field-error quote-summary" role="alert">Some details are missing. Check the fields marked in red.</p>}
            {message && state === "error" && <p className="submission-message error" role="status">{message}</p>}
          </>}
        </aside>
      </form>
      <div className="quote-privacy"><PrivacyNote text="We use your details only to prepare your quote." /></div>
    </main>
  );
}
