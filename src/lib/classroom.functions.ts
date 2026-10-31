import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { esc, layout, sendEmail } from "./email.server";

const origin = () => new URL(getRequest().url).origin;

/** Student joins a classroom by code; the teacher gets an email notification. */
export const joinClassroom = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ code: z.string().trim().regex(/^[A-Za-z0-9]{6}$/) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase.rpc("join_classroom", { _code: data.code });
    if (error) {
      const m = error.message;
      return { ok: false as const, reason: m.includes("invalid_code") ? "invalid_code" : m.includes("not_student") ? "not_student" : "error" };
    }
    const row = rows?.[0];
    if (!row) return { ok: false as const, reason: "invalid_code" };
    let notified = false;
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: t } = await supabaseAdmin.auth.admin.getUserById(row.teacher_id);
      const { data: p } = await supabaseAdmin.from("profiles").select("full_name").eq("id", context.userId).maybeSingle();
      const studentEmail = (context.claims as { email?: string }).email ?? "";
      if (t.user?.email) {
        const r = await sendEmail({
          to: [t.user.email],
          subject: `A student joined ${row.classroom_name}`,
          html: layout("New student in your classroom", `<p><strong>${esc(p?.full_name || studentEmail)}</strong> joined <strong>${esc(row.classroom_name)}</strong>.</p>`),
        });
        notified = r.ok;
      }
    } catch (e) { console.error("Teacher notification failed", e); }
    return { ok: true as const, classroomName: row.classroom_name, teacherNotified: notified };
  });

/** Teacher emails an invitation for one of their own classrooms. */
export const sendClassInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ classroomId: z.string().uuid(), emails: z.array(z.string().trim().email()).min(1).max(20) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: c } = await context.supabase.from("classrooms").select("id,name,code,teacher_id").eq("id", data.classroomId).maybeSingle();
    if (!c || c.teacher_id !== context.userId) return { ok: false as const, error: "Classroom not found." };
    const link = `${origin()}/join/${c.code}`;
    const teacherEmail = (context.claims as { email?: string }).email;
    const r = await sendEmail({
      to: data.emails,
      subject: `You're invited to join ${c.name} on SCIENCE EXPLORER`,
      html: layout(`Join ${c.name}`, `<p>Your teacher invited you to their science classroom.</p>
        <p>Classroom code: <strong style="font-size:20px;letter-spacing:3px">${esc(c.code)}</strong></p>
        <p><a href="${esc(link)}" style="display:inline-block;background:#4f6bd8;color:#ffffff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:bold">Join classroom</a></p>
        <p style="font-size:12px;color:#64748b">Or open: ${esc(link)}</p>`),
      ...(teacherEmail ? { replyTo: teacherEmail } : {}),
    });
    return r.ok ? { ok: true as const } : { ok: false as const, error: deliveryError(r.status, r.error) };
  });

/** Sends a test email to the signed-in user's own address. */
export const sendTestEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const email = (context.claims as { email?: string }).email;
    if (!email) return { ok: false as const, error: "No email on this account." };
    const r = await sendEmail({ to: [email], subject: "SCIENCE EXPLORER test email", html: layout("Email delivery works", "<p>This is a real test email sent through Resend.</p>") });
    return r.ok ? { ok: true as const, to: email } : { ok: false as const, error: deliveryError(r.status, r.error) };
  });

function deliveryError(status: number, body: string) {
  if (status === 403 && /testing emails|verify a domain/i.test(body))
    return "Resend can only send to your own Resend account email until a domain is verified in Resend.";
  return `Email could not be sent (error ${status}).`;
}
