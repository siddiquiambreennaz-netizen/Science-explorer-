// Server-only: sends email through the Resend connection (via the Lovable connector gateway).
const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";
// No verified domain yet: Resend's shared test sender only delivers to the Resend account owner's address.
export const FROM_ADDRESS = "SCIENCE EXPLORER <onboarding@resend.dev>";

export async function sendEmail(opts: { to: string[]; subject: string; html: string; replyTo?: string }) {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const resendKey = process.env["RESEND_API_KEY"];
  if (!lovableKey || !resendKey) throw new Error("Email service is not configured");
  const res = await fetch(`${GATEWAY_URL}/emails`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": resendKey,
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
    }),
  });
  const body = await res.text();
  if (!res.ok) {
    console.error(`Resend send failed [${res.status}]: ${body}`);
    return { ok: false as const, status: res.status, error: body };
  }
  return { ok: true as const, id: (JSON.parse(body) as { id?: string }).id ?? null };
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function layout(title: string, inner: string) {
  return `<div style="font-family:Arial,sans-serif;background:#ffffff;padding:24px;color:#1e293b">
  <div style="max-width:520px;margin:auto;border:1px solid #e0e7ff;border-radius:16px;padding:24px">
  <h2 style="color:#4f6bd8;margin:0 0 12px">SCIENCE EXPLORER</h2><h3 style="margin:0 0 12px">${esc(title)}</h3>${inner}</div></div>`;
}
export { esc };
