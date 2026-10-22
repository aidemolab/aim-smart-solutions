import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withCors } from "../_shared/cors.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import nodemailer from "npm:nodemailer@6.9.16";

const json = (body: unknown, status = 200) => Response.json(body, { status });
const clean = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";
const escapeHtml = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");

Deno.serve(withCors(async (request: Request) => {
  if (request.method !== "POST") return json({ ok: false, message: "Method not allowed." }, 405);

  const calendarUrl = Deno.env.get("GOOGLE_BOOKING_URL");
  const bookingSecret = Deno.env.get("BOOKING_SECRET");
  if (!calendarUrl || !bookingSecret) return json({ ok: false, message: "The booking service is unavailable." }, 503);

  let body: Record<string, unknown>;
  try { body = await request.json(); }
  catch { return json({ ok: false, message: "Invalid request." }, 400); }

  const action = body.action === "book" ? "book" : "availability";
  if (action === "availability") {
    const response = await fetch(calendarUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, token: bookingSecret, startDate: new Date().toISOString() }),
      redirect: "follow",
    });
    if (!response.ok) return json({ ok: false, message: "Available times could not be loaded." }, 502);
    const result = await response.json();
    return json(result, result?.ok ? 200 : 502);
  }

  const name = clean(body.name, 100);
  const businessName = clean(body.businessName, 150);
  const email = clean(body.email, 254).toLowerCase();
  const mobile = clean(body.mobile, 30);
  const jobDescription = clean(body.jobDescription, 2000);
  const appointmentAt = clean(body.appointmentAt, 50);
  const appointmentDate = new Date(appointmentAt);

  if (!name || !email || !mobile || !jobDescription || !appointmentAt || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || Number.isNaN(appointmentDate.getTime()) || appointmentDate <= new Date()) {
    return json({ ok: false, message: "Complete all booking fields and select an available time." }, 400);
  }

  const calendarResponse = await fetch(calendarUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, token: bookingSecret, name, email, mobile, jobDescription, appointmentAt }),
    redirect: "follow",
  });
  const calendarText = await calendarResponse.text();
  const calendarResult = (() => {
    try { return JSON.parse(calendarText); }
    catch { return null; }
  })();
  if (!calendarResponse.ok || calendarResult?.ok === false) {
    return json({ ok: false, unavailable: calendarResult?.unavailable === true, message: calendarResult?.message || "This appointment could not be booked." }, calendarResult?.unavailable ? 409 : 502);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return json({ ok: false, message: "The booking database is unavailable." }, 503);
  const supabase = createClient(supabaseUrl, serviceKey);

  const { data: customer, error: customerError } = await supabase.from("customers").upsert({ name, business_name: businessName || null, email, mobile }, { onConflict: "email" }).select("id").single();
  if (customerError || !customer) return json({ ok: false, message: "The appointment was created, but its customer record could not be saved." }, 502);

  const savedAppointmentAt = calendarResult?.appointmentAt || appointmentAt;
  const { data: appointment, error: appointmentError } = await supabase.from("appointments").insert({
    customer_id: customer.id,
    job_description: jobDescription,
    appointment_at: savedAppointmentAt,
    calendar_event_id: calendarResult?.eventId || null,
    status: "booked",
  }).select("id").single();
  if (appointmentError || !appointment) {
    console.error("Booking record save failed", appointmentError?.message);
    return json({ ok: false, message: "The appointment was created, but its booking record could not be saved." }, 502);
  }

  const smtpHost = Deno.env.get("IONOS_SMTP_HOST");
  const smtpPort = Number(Deno.env.get("IONOS_SMTP_PORT") ?? "465");
  const smtpUser = Deno.env.get("IONOS_SMTP_USER");
  const smtpPassword = Deno.env.get("IONOS_SMTP_PASSWORD");
  if (!smtpHost || !smtpUser || !smtpPassword) return json({ ok: false, message: "Your appointment is booked, but its confirmation email could not be sent." }, 502);

  const when = new Intl.DateTimeFormat("en-GB", { dateStyle: "full", timeStyle: "short", timeZone: "Europe/London" }).format(new Date(savedAppointmentAt));
  try {
    const transporter = nodemailer.createTransport({ host: smtpHost, port: smtpPort, secure: smtpPort === 465, auth: { user: smtpUser, pass: smtpPassword } });
    await transporter.sendMail({
      from: `AIM Smart Solutions <${smtpUser}>`, to: email, replyTo: smtpUser,
      subject: "Your appointment is confirmed - AIM Smart Solutions",
      text: `Hello ${name},\n\nYour appointment with AIM Smart Solutions is confirmed for ${when}.\n\nJob or service: ${jobDescription}\n\nWe will send you a reminder before the appointment.\n\nKind regards,\nAIM Smart Solutions\n${smtpUser}`,
      html: `<p>Hello ${escapeHtml(name)},</p><p>Your appointment with AIM Smart Solutions is confirmed for <strong>${escapeHtml(when)}</strong>.</p><p><strong>Job or service:</strong><br>${escapeHtml(jobDescription).replaceAll("\n", "<br>")}</p><p>We will send you a reminder before the appointment.</p><p>Kind regards,<br>AIM Smart Solutions<br><a href="mailto:${smtpUser}">${smtpUser}</a></p>`,
    });
    await supabase.from("appointments").update({ confirmation_sent: true }).eq("id", appointment.id);
  } catch (error) {
    console.error("Confirmation email failed", error);
    return json({ ok: false, message: "Your appointment is booked, but its confirmation email could not be sent." }, 502);
  }

  return json({ ok: true, appointmentAt: savedAppointmentAt, emailSent: true });
}));
