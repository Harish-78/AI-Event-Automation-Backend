import nodemailer, { Transporter } from "nodemailer";
import { logger } from "../logger/logger";

const transporter: Transporter = nodemailer.createTransport({
  service: "gmail",
  auth: process.env.SMTP_USER
    ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      }
    : undefined,
});

export async function sendVerificationEmail(
  to: string,
  name: string,
  verificationUrl: string,
): Promise<void> {
  logger.info({ to }, "EmailService: sendVerificationEmail - Init");
  const from =
    process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@example.com";
  const html = `
    <h2>Verify your email</h2>
    <p>Hi ${name || "there"},</p>
    <p>Please verify your email by clicking the link below:</p>
    <p><a href="${verificationUrl}">${verificationUrl}</a></p>
    <p>This link expires in 24 hours.</p>
    <p>If you didn't create an account, you can ignore this email.</p>
  `;
  try {
    await transporter.sendMail({
      from: `"Event Automation" <${from}>`,
      to,
      subject: "Verify your email - Event Automation",
      html,
    });
    logger.info({ to }, "EmailService: sendVerificationEmail - Completion");
  } catch (err) {
    logger.error({ err, to }, "Failed to send verification email");
    throw err;
  }
}
