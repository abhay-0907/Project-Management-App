import { sendEmail } from "../../utils/sendEmail.js";

export async function sendWorkspaceInvitationEmail(input: {
  to: string; workspaceName: string; inviterName: string; role: "ADMIN" | "MEMBER"; token: string; expiresAt: Date;
}) {
  const origin = (process.env.CLIENT_ORIGIN ?? "http://localhost:3000").replace(/\/+$/, "");
  const link = `${origin}/invite/${encodeURIComponent(input.token)}`;
  const expiration = input.expiresAt.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }) + " UTC";
  const safe = (value: string) => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
  await sendEmail({
    to: input.to,
    subject: `You've been invited to ${input.workspaceName} on Nexora`,
    text: `Hi,\n\n${input.inviterName} invited you to join ${input.workspaceName} as a ${input.role}.\n\nAccept: ${link}\n\nThis invitation expires ${expiration}. If you weren't expecting this, you can ignore this email.`,
    html: `<h2>You've been invited to ${safe(input.workspaceName)}</h2><p>Hi,</p><p><strong>${safe(input.inviterName)}</strong> invited you to join <strong>${safe(input.workspaceName)}</strong> as a ${input.role}.</p><p><a href="${safe(link)}" style="display:inline-block;padding:12px 20px;background:#4f46e5;color:white;text-decoration:none;border-radius:8px">Accept invitation</a></p><p>This invitation expires ${safe(expiration)}.</p><p>If you weren't expecting this, you can ignore this email.</p>`,
  });
}
