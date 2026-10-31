import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How AIM Smart Solutions collects, uses and protects personal data under UK GDPR, including enquiries, quotes, bookings, AI call-backs and the interactive demos.",
  alternates: { canonical: "/privacy/" },
};

const processors = [
  ["Supabase", "Database and server functions for the forms, bookings and demos", "UK (London data centre); Supabase is a US company"],
  ["IONOS", "Email: sending confirmations and holding our mailbox", "UK / EU"],
  ["Google (Calendar)", "Holding booked appointments in our calendar", "Global, including the US"],
  ["Vapi", "Placing the optional AI call-back to your mobile, if you ask for one", "US"],
  ["Cloudflare (Turnstile)", "Checking that form submissions come from people, not bots", "Global, including the US"],
  ["OpenRouter and the AI model provider it routes to", "Generating text in the AI demos (content generator, pharma assistant)", "US and other countries"],
  ["GitHub (GitHub Pages)", "Hosting this website; keeps standard server logs such as IP addresses", "US"],
];

export default function Privacy() {
  return (
    <main id="main" className="services-main">
      <section className="services-hero privacy-hero">
        <p className="privacy-draft" role="note">Draft for owner review</p>
        <p className="kicker">Privacy</p>
        <h1>Privacy <em>policy</em></h1>
        <p>This policy explains how AIM Smart Solutions uses personal data when you use this website, contact us, request a quote, book a call or try a demo. Last updated: 22 October 2026 (draft).</p>
      </section>

      <article className="privacy">
        <h2>1. Who we are</h2>
        <p>The data controller is <strong>AIM Smart Solutions</strong> (Alaa Mostafa), based in Bolton, United Kingdom. Contact: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. [Owner to add: ICO registration number, if registered.]</p>

        <h2>2. What we collect</h2>
        <ul>
          <li><strong>Enquiry form:</strong> your first name, business name, email address, UK mobile number and message. If you choose an urgent AI call-back: your consent, the time you gave it and the wording you agreed to.</li>
          <li><strong>Quote request:</strong> your name, business name, email, mobile number, the services you select and what you tell us about them.</li>
          <li><strong>Booking a call:</strong> your name, business name (optional), email, mobile number, what you would like to discuss and the time you choose.</li>
          <li><strong>Security and fair use:</strong> a one-way scrambled (hashed) version of your IP address to apply daily limits, and the result of the Cloudflare Turnstile check.</li>
          <li><strong>AI call-back:</strong> if you ask for one, your mobile number is passed to Vapi to place the call, and the conversation is processed by Vapi and its AI providers.</li>
          <li><strong>Emails:</strong> copies of the emails we send you and receive from you are kept in our mailbox.</li>
          <li><strong>Website hosting:</strong> GitHub Pages keeps standard server logs (such as IP address and browser type) for security.</li>
        </ul>

        <h2>3. The interactive demos</h2>
        <ul>
          <li><strong>Supplier risk, sales lead scoring and property apps:</strong> the sample data is fictional. Anything you add is saved against a random identifier stored in your browser (not your name) and is <strong>deleted automatically after 24 hours</strong>. Please do not enter personal or confidential information.</li>
          <li><strong>AI Content &amp; Keyword Generator:</strong> what you type is sent to an AI service through our server to create the content. We <strong>do not store your inputs or the results</strong>. We keep only a hashed IP counter for the daily limit, deleted after a few days.</li>
          <li><strong>Other demos</strong> (opportunity score, skills taster) run entirely in your browser and send nothing to us.</li>
        </ul>

        <h2>4. Why we use it and our lawful bases</h2>
        <ul>
          <li><strong>Replying to enquiries, preparing quotes and arranging bookings:</strong> to take steps at your request before a possible contract, and our legitimate interest in responding to people who contact us.</li>
          <li><strong>AI call-back:</strong> your <strong>consent</strong>, given by ticking the box. You can withdraw it at any time by emailing us; this does not affect calls already made.</li>
          <li><strong>Confirmation and reminder emails:</strong> to provide the booking you asked for.</li>
          <li><strong>Security, spam prevention and daily limits:</strong> our legitimate interest in keeping the site and demos safe and available.</li>
          <li><strong>Running the demos:</strong> our legitimate interest in showing how our services work.</li>
        </ul>
        <p>We do not sell your data, use it for advertising, or make decisions about you by automated means that have legal or similarly significant effects.</p>

        <h2>5. Who processes data for us</h2>
        <div className="privacy-table" role="region" aria-label="Processors" tabIndex={0}>
          <table>
            <thead><tr><th scope="col">Provider</th><th scope="col">What they do for us</th><th scope="col">Where</th></tr></thead>
            <tbody>{processors.map(([name, what, where]) => <tr key={name}><th scope="row">{name}</th><td>{what}</td><td>{where}</td></tr>)}</tbody>
          </table>
        </div>

        <h2>6. International transfers</h2>
        <p>Some providers are based in, or may access data from, the United States and other countries outside the UK. Where this happens we rely on UK adequacy regulations (for example the UK–US data bridge for certified companies) or the UK International Data Transfer Agreement or Addendum included in the provider&apos;s terms. [Owner to confirm the safeguard for each provider.]</p>

        <h2>7. How long we keep it</h2>
        <ul>
          <li>Enquiries, quote requests, bookings and related emails: [owner to confirm, suggested: up to 24 months after our last contact], unless we go on to work together.</li>
          <li>Call-back consent records: for as long as we keep the related enquiry.</li>
          <li>Demo app records: 24 hours. Content generator inputs: not stored. Hashed IP counters: a few days.</li>
          <li>AI call records held by Vapi: [owner to confirm Vapi retention settings].</li>
        </ul>

        <h2>8. Cookies and browser storage</h2>
        <p>We do not use advertising or analytics cookies. The demo apps store a random identifier in your browser so your own records show up for 24 hours. Cloudflare Turnstile may use browser data to tell people and bots apart.</p>

        <h2>9. Your rights</h2>
        <p>Under UK GDPR you can ask for a copy of your data, ask us to correct or delete it, restrict or object to how we use it, ask for it to be transferred, and withdraw consent at any time. Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. We will reply within one month.</p>

        <h2>10. Complaints</h2>
        <p>If you are unhappy with how we use your data, please contact us first. You also have the right to complain to the Information Commissioner&apos;s Office (ICO): <a href="https://ico.org.uk/make-a-complaint/">ico.org.uk/make-a-complaint</a>, telephone 0303 123 1113.</p>

        <h2>11. Changes</h2>
        <p>We will update this page if our use of data changes, and show the date of the latest version at the top.</p>

        <p className="privacy-back"><Link href="/contact/">Contact us</Link> · <Link href="/">Back to the homepage</Link></p>
      </article>
    </main>
  );
}
