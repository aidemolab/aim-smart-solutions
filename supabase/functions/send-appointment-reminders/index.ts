// send-appointment-reminders: one reminder email (customer + business) about 24 hours before each booked
// appointment. Called hourly by pg_cron (job "appointment-reminders-hourly"), which sends the
// x-cron-secret header from the Vault. Requests without the matching secret are rejected.
//
// No duplicates: each reminder flag is claimed with a conditional update (only if still false) before the
// email is sent, and released again if sending fails so the next hourly run can retry.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import nodemailer from "npm:nodemailer@6.9.16";

const WINDOW_START_HOURS = 2; // never remind for appointments starting within 2 hours
const WINDOW_END_HOURS = 24; // remind once the appointment is within 24 hours

function sameSecret(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req: Request) => {
  const expected = Deno.env.get("REMINDERS_CRON_SECRET") ?? "";
  if (!sameSecret(req.headers.get("x-cron-secret") ?? "", expected)) {
    return Response.json({ ok: false, message: "Unauthorised" }, { status: 401 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const smtpHost = Deno.env.get("IONOS_SMTP_HOST")!;
  const smtpPort = Number(Deno.env.get("IONOS_SMTP_PORT") ?? "465");
  const smtpUser = Deno.env.get("IONOS_SMTP_USER")!;
  const smtpPassword = Deno.env.get("IONOS_SMTP_PASSWORD")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const now = Date.now();
  const from = new Date(now + WINDOW_START_HOURS * 3600_000).toISOString();
  const to = new Date(now + WINDOW_END_HOURS * 3600_000).toISOString();

  const { data: appointments, error } = await supabase
    .from("appointments")
    .select("id,job_description,appointment_at,customer_reminder_sent,business_reminder_sent,customers(name,email,mobile)")
    .eq("status", "booked")
    .gt("appointment_at", from)
    .lte("appointment_at", to)
    .or("customer_reminder_sent.eq.false,business_reminder_sent.eq.false");
  if (error) return Response.json({ ok: false, message: "Could not read appointments" }, { status: 500 });

  const transporter = nodemailer.createTransport({ host: smtpHost, port: smtpPort, secure: smtpPort === 465, auth: { user: smtpUser, pass: smtpPassword } });

  // Claim a flag (false -> true). Returns true only for the run that claimed it.
  const claim = async (id: string, column: "customer_reminder_sent" | "business_reminder_sent") => {
    const { data } = await supabase.from("appointments").update({ [column]: true }).eq("id", id).eq(column, false).select("id");
    return Boolean(data && data.length);
  };
  const release = (id: string, column: "customer_reminder_sent" | "business_reminder_sent") =>
    supabase.from("appointments").update({ [column]: false }).eq("id", id);

  let sent = 0, failed = 0;
  for (const appointment of appointments ?? []) {
    const customer = Array.isArray(appointment.customers) ? appointment.customers[0] : appointment.customers;
    if (!customer) continue;
    const when = new Intl.DateTimeFormat("en-GB", { dateStyle: "full", timeStyle: "short", timeZone: "Europe/London" }).format(new Date(appointment.appointment_at));

    if (!appointment.customer_reminder_sent && await claim(appointment.id, "customer_reminder_sent")) {
      try {
        await transporter.sendMail({
          from: `AIM Smart Solutions <${smtpUser}>`, to: customer.email, replyTo: smtpUser,
          subject: "Appointment reminder - AIM Smart Solutions",
          text: `Hello ${customer.name},\n\nThis is a reminder that your appointment with AIM Smart Solutions is at ${when}.\n\nJob or service: ${appointment.job_description}\n\nIf you need to change the time, just reply to this email.\n\nKind regards,\nAIM Smart Solutions\n${smtpUser}`,
        });
        sent++;
      } catch {
        await release(appointment.id, "customer_reminder_sent");
        failed++;
      }
    }
    if (!appointment.business_reminder_sent && await claim(appointment.id, "business_reminder_sent")) {
      try {
        await transporter.sendMail({
          from: `AIM Smart Solutions <${smtpUser}>`, to: smtpUser, replyTo: customer.email,
          subject: `Appointment tomorrow - ${customer.name}`,
          text: `Appointment: ${when}\nCustomer: ${customer.name}\nEmail: ${customer.email}\nMobile: ${customer.mobile || "Not provided"}\nJob: ${appointment.job_description}`,
        });
        sent++;
      } catch {
        await release(appointment.id, "business_reminder_sent");
        failed++;
      }
    }
  }

  return Response.json({ ok: true, checked: appointments?.length ?? 0, sent, failed });
});
