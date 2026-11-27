import "dotenv/config";
import { sendEmail } from "../src/utils/sendEmail.js";

const recipient = process.argv[2]?.trim();

if (!recipient) {
  console.error("Usage: npm run email:test -- <recipient-email>");
  process.exitCode = 1;
} else {
  try {
    await sendEmail({
      to: recipient,
      subject: "Brevo API test",
      text: "This is a test email sent through the Brevo HTTP API.",
      html: "<p>This is a test email sent through the Brevo HTTP API.</p>",
    });
    console.log(`Brevo accepted the test email for ${recipient}.`);
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown error";
    console.error(`Brevo test email failed: ${detail}`);
    process.exitCode = 1;
  }
}
