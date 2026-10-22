import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import nodemailer from "npm:nodemailer@6.9.16";

const escapeHtml = (value: string) =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");

Deno.serve(async (request: Request) => {
  if (request.method !== "POST") {
    return Response.json({ ok: false, message: "Method not allowed." }, { status: 405 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    return Response.json({ ok: false, message: "Database service is unavailable." }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, message: "Invalid request." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim().slice(0, 100) : "";
  const businessName = typeof body.businessName === "string" ? body.businessName.trim().slice(0, 150) : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase().slice(0, 254) : "";
  const mobile = typeof body.mobile === "string" ? body.mobile.trim().slice(0, 30) : "";
  const enquiryText = typeof body.enquiry === "string" ? body.enquiry.trim().slice(0, 5000) : "";
  const urgency = body.urgency === "urgent" ? "urgent" : "normal";

  if (!name || !businessName || !email || !mobile || !enquiryText || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ ok: false, message: "Complete all enquiry fields." }, { status: 400 });
  }

  const headers = {
    "Authorization": `Bearer ${serviceKey}`,
    "apikey": serviceKey,
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates,return=representation",
  };

  const customerResponse = await fetch(
    `${supabaseUrl}/rest/v1/customers?on_conflict=email`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ name, business_name: businessName, email, mobile }),
    },
  );

  if (!customerResponse.ok) {
    console.error("Customer save failed", customerResponse.status, await customerResponse.text());
    return Response.json({ ok: false, message: "We could not save your enquiry." }, { status: 502 });
  }

  const customers = await customerResponse.json();
  const customerId = customers?.[0]?.id;
  if (!customerId) {
    return Response.json({ ok: false, message: "We could not save your enquiry." }, { status: 502 });
  }

  const enquiryResponse = await fetch(`${supabaseUrl}/rest/v1/enquiries`, {
    method: "POST",
    headers: { ...headers, "Prefer": "return=minimal" },
    body: JSON.stringify({
      customer_id: customerId,
      enquiry_text: enquiryText,
      urgency,
      status: "new",
    }),
  });

  if (!enquiryResponse.ok) {
    console.error("Enquiry save failed", enquiryResponse.status, await enquiryResponse.text());
    return Response.json({ ok: false, message: "We could not save your enquiry." }, { status: 502 });
  }

  const smtpHost = Deno.env.get("IONOS_SMTP_HOST");
  const smtpPort = Number(Deno.env.get("IONOS_SMTP_PORT") ?? "465");
  const smtpUser = Deno.env.get("IONOS_SMTP_USER");
  const smtpPassword = Deno.env.get("IONOS_SMTP_PASSWORD");

  if (!smtpHost || !smtpUser || !smtpPassword || !Number.isInteger(smtpPort)) {
    console.error("SMTP configuration is incomplete");
    return Response.json({ ok: false, message: "Your enquiry was saved, but the acknowledgement email could not be sent." }, { status: 502 });
  }

  const urgentText = urgency === "urgent"
    ? "\n\nYou selected Urgent. Our AI assistant will call the mobile number you provided."
    : "";
  const urgentHtml = urgency === "urgent"
    ? "<p><strong>You selected Urgent.</strong> Our AI assistant will call the mobile number you provided.</p>"
    : "";

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPassword },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });

    await transporter.sendMail({
      from: `AIM Smart Solutions <${smtpUser}>`,
      to: email,
      replyTo: smtpUser,
      subject: "We have received your enquiry - AIM Smart Solutions",
      text: `Hello ${name},\n\nThank you for contacting AIM Smart Solutions. We have received your enquiry and will get back to you within 24 hours.\n\nYour enquiry:\n${enquiryText}${urgentText}\n\nKind regards,\nAIM Smart Solutions\n${smtpUser}`,
      html: `<p>Hello ${escapeHtml(name)},</p><p>Thank you for contacting AIM Smart Solutions. We have received your enquiry and will get back to you within 24 hours.</p><p><strong>Your enquiry:</strong><br>${escapeHtml(enquiryText).replaceAll("\n", "<br>")}</p>${urgentHtml}<p>Kind regards,<br>AIM Smart Solutions<br><a href="mailto:${smtpUser}">${smtpUser}</a></p>`,
    });
  } catch (error) {
    console.error("Acknowledgement email failed:", error instanceof Error ? error.message : "Unknown error");
    return Response.json({ ok: false, message: "Your enquiry was saved, but the acknowledgement email could not be sent." }, { status: 502 });
  }

  return Response.json({ ok: true, emailSent: true });
});