import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import nodemailer from "npm:nodemailer@6.9.16";

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const smtpHost = Deno.env.get("IONOS_SMTP_HOST")!;
  const smtpPort = Number(Deno.env.get("IONOS_SMTP_PORT") ?? "465");
  const smtpUser = Deno.env.get("IONOS_SMTP_USER")!;
  const smtpPassword = Deno.env.get("IONOS_SMTP_PASSWORD")!;
  const supabase = createClient(supabaseUrl, serviceKey);
  const now = new Date();
  const cutoff = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const { data: appointments, error } = await supabase.from("appointments").select("id,job_description,appointment_at,customer_reminder_sent,business_reminder_sent,customers(name,email,mobile)").eq("status", "booked").gt("appointment_at", now.toISOString()).lte("appointment_at", cutoff.toISOString()).or("customer_reminder_sent.eq.false,business_reminder_sent.eq.false");
  if (error) return Response.json({ ok: false, message: error.message }, { status: 500 });

  const transporter = nodemailer.createTransport({ host: smtpHost, port: smtpPort, secure: smtpPort === 465, auth: { user: smtpUser, pass: smtpPassword } });
  let sent = 0;
  for (const appointment of appointments ?? []) {
    const customer = Array.isArray(appointment.customers) ? appointment.customers[0] : appointment.customers;
    if (!customer) continue;
    const when = new Intl.DateTimeFormat("en-GB", { dateStyle: "full", timeStyle: "short", timeZone: "Europe/London" }).format(new Date(appointment.appointment_at));
    const updates: Record<string, boolean> = {};
    if (!appointment.customer_reminder_sent) {
      await transporter.sendMail({ from: `AIM Smart Solutions <${smtpUser}>`, to: customer.email, replyTo: smtpUser, subject: "Appointment reminder - AIM Smart Solutions", text: `Hello ${customer.name},\n\nThis is a reminder that your appointment with AIM Smart Solutions is at ${when}.\n\nJob or service: ${appointment.job_description}\n\nKind regards,\nAIM Smart Solutions\n${smtpUser}` });
      updates.customer_reminder_sent = true;
      sent++;
    }
    if (!appointment.business_reminder_sent) {
      await transporter.sendMail({ from: `AIM Smart Solutions <${smtpUser}>`, to: smtpUser, replyTo: customer.email, subject: `Job reminder - ${customer.name}`, text: `Appointment: ${when}\nCustomer: ${customer.name}\nEmail: ${customer.email}\nMobile: ${customer.mobile || "Not provided"}\nJob: ${appointment.job_description}` });
      updates.business_reminder_sent = true;
      sent++;
    }
    await supabase.from("appointments").update(updates).eq("id", appointment.id);
  }

  return Response.json({ ok: true, sent });
});
