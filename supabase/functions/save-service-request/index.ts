import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withCors } from "../_shared/cors.ts";
import nodemailer from "npm:nodemailer@6.9.16";

const clean = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";
const escapeHtml = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");

Deno.serve(withCors(async (request: Request) => {
  if (request.method !== "POST") return Response.json({ ok: false, message: "Method not allowed." }, { status: 405 });
  let body: Record<string, unknown>;
  try { body = await request.json(); }
  catch { return Response.json({ ok: false, message: "Invalid request." }, { status: 400 }); }

  const name = clean(body.name, 100);
  const businessName = clean(body.businessName, 150);
  const email = clean(body.email, 254).toLowerCase();
  const mobile = clean(body.mobile, 30);
  const services = Array.isArray(body.services) ? body.services.map((item) => {
    const service = item && typeof item === "object" ? item as Record<string, unknown> : {};
    return { id: clean(service.id, 50), name: clean(service.name, 150), details: clean(service.details, 3000) };
  }).filter((service) => service.id && service.name && service.details).slice(0, 6) : [];
  if (!name || !businessName || !email || !mobile || services.length === 0 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Response.json({ ok: false, message: "Complete all service request fields." }, { status: 400 });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const smtpHost = Deno.env.get("IONOS_SMTP_HOST");
  const smtpPort = Number(Deno.env.get("IONOS_SMTP_PORT") ?? "465");
  const smtpUser = Deno.env.get("IONOS_SMTP_USER");
  const smtpPassword = Deno.env.get("IONOS_SMTP_PASSWORD");
  if (!supabaseUrl || !serviceKey || !smtpHost || !smtpUser || !smtpPassword) return Response.json({ ok: false, message: "The service request is temporarily unavailable." }, { status: 503 });

  const headers = { "Authorization": `Bearer ${serviceKey}`, "apikey": serviceKey, "Content-Type": "application/json", "Prefer": "resolution=merge-duplicates,return=representation" };
  const customerResponse = await fetch(`${supabaseUrl}/rest/v1/customers?on_conflict=email`, { method: "POST", headers, body: JSON.stringify({ name, business_name: businessName, email, mobile }) });
  if (!customerResponse.ok) return Response.json({ ok: false, message: "We could not save your service request." }, { status: 502 });
  const customerId = (await customerResponse.json())?.[0]?.id;
  if (!customerId) return Response.json({ ok: false, message: "We could not save your service request." }, { status: 502 });

  const reference = `AIM-REQ-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const quoteResponse = await fetch(`${supabaseUrl}/rest/v1/quotes`, { method: "POST", headers: { ...headers, "Prefer": "return=minimal" }, body: JSON.stringify({ customer_id: customerId, reference, selected_services: services, total_price_pence: 0, status: "draft" }) });
  if (!quoteResponse.ok) return Response.json({ ok: false, message: "We could not save your service request." }, { status: 502 });

  const textList = services.map((service) => `${service.name}:\n${service.details}`).join("\n\n");
  const htmlList = services.map((service) => `<p><strong>${escapeHtml(service.name)}</strong><br>${escapeHtml(service.details).replaceAll("\n", "<br>")}</p>`).join("");
  const transporter = nodemailer.createTransport({ host: smtpHost, port: smtpPort, secure: smtpPort === 465, auth: { user: smtpUser, pass: smtpPassword }, connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000 });
  try {
    await transporter.sendMail({
      from: `AIM Smart Solutions <${smtpUser}>`, to: email, replyTo: smtpUser,
      subject: "We have received your service request - AIM Smart Solutions",
      text: `Hello ${name},\n\nThank you for contacting AIM Smart Solutions. We have received your service request and will contact you within 24 hours.\n\nYour requested services:\n\n${textList}\n\nKind regards,\nAIM Smart Solutions\n${smtpUser}`,
      html: `<p>Hello ${escapeHtml(name)},</p><p>Thank you for contacting AIM Smart Solutions. We have received your service request and will contact you within 24 hours.</p><p><strong>Your requested services:</strong></p>${htmlList}<p>Kind regards,<br>AIM Smart Solutions<br><a href="mailto:${smtpUser}">${smtpUser}</a></p>`,
    });
    await transporter.sendMail({
      from: `AIM Smart Solutions <${smtpUser}>`, to: smtpUser, replyTo: email,
      subject: `New service request - ${businessName}`,
      text: `Reference: ${reference}\nCustomer: ${name}\nBusiness: ${businessName}\nEmail: ${email}\nMobile: ${mobile}\n\nRequested services:\n\n${textList}`,
      html: `<p><strong>New service request</strong></p><p>Reference: ${escapeHtml(reference)}<br>Customer: ${escapeHtml(name)}<br>Business: ${escapeHtml(businessName)}<br>Email: <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a><br>Mobile: ${escapeHtml(mobile)}</p><p><strong>Requested services:</strong></p>${htmlList}`,
    });
  } catch (error) {
    console.error("Service request email failed", error);
    return Response.json({ ok: false, message: "Your request was saved, but its confirmation email could not be sent." }, { status: 502 });
  }
  return Response.json({ ok: true, reference, emailsSent: 2 });
}));
