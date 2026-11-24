import nodemailer from "nodemailer";

const SMTP_HOST = "smtp-relay.brevo.com";
const SMTP_PORT = 587;
let transporter: ReturnType<typeof nodemailer.createTransport> | undefined;

export async function sendConfiguredEmail(message: {
  to: string;
  subject: string;
  text: string;
  html: string;
}) {
  const { SMTP_USER, SMTP_PASS, SENDER_EMAIL } = process.env;
  if (!SMTP_USER || !SMTP_PASS || !SENDER_EMAIL) {
    throw new Error("SMTP_USER, SMTP_PASS, and SENDER_EMAIL must be configured to send email");
  }

  transporter ??= nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: false,
    requireTLS: true,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  await transporter.sendMail({ from: SENDER_EMAIL, ...message });
}
