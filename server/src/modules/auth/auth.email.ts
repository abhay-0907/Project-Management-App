import { sendConfiguredEmail } from "../../config/mailer.js";

export async function sendVerificationCode(email: string, name: string, otp: string) {
  await sendConfiguredEmail({
    to: email,
    subject: "Your Nexora verification code",
    text: `Hi ${name},\n\nYour Nexora email verification code is ${otp}. It expires in 5 minutes.\n\nIf you did not create a Nexora account, you can ignore this email.`,
    html: `<p>Hi ${escapeHtml(name)},</p><p>Your Nexora email verification code is:</p><p style="font-size: 24px; font-weight: bold; letter-spacing: 5px">${otp}</p><p>This code expires in 5 minutes.</p><p>If you did not create a Nexora account, you can ignore this email.</p>`,
  });
}

export async function sendPasswordResetCode(email: string, name: string, otp: string) {
  await sendConfiguredEmail({
    to: email,
    subject: "Your Nexora password reset code",
    text: `Hi ${name},\n\nYour Nexora password reset code is ${otp}. It expires in 5 minutes.\n\nIf you did not request a password reset, you can ignore this email.`,
    html: `<p>Hi ${escapeHtml(name)},</p><p>Your Nexora password reset code is:</p><p style="font-size: 24px; font-weight: bold; letter-spacing: 5px">${otp}</p><p>This code expires in 5 minutes.</p><p>If you did not request a password reset, you can ignore this email.</p>`,
  });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]!);
}
