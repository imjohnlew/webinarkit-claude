import nodemailer from 'nodemailer';
import { env } from '../config/env';
import type { Registrant, Webinar, WebinarSession } from '../types';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

export const emailService = {
  async sendRegistrationConfirmation(
    registrant: Registrant,
    webinar: Webinar,
    session: WebinarSession,
  ): Promise<void> {
    const watchUrl = `${env.APP_URL}/watch/${registrant.watch_token}`;
    const sessionDate = formatDate(session.scheduled_at);

    await transporter.sendMail({
      from: `"${env.EMAIL_FROM_NAME}" <${env.EMAIL_FROM_ADDRESS}>`,
      to: registrant.email,
      subject: `You're registered: ${webinar.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h2 style="color: #2563eb;">You're registered! 🎉</h2>
          <p>Hi ${registrant.first_name},</p>
          <p>You're all set for <strong>${webinar.title}</strong> hosted by <strong>${webinar.host_name}</strong>.</p>

          <div style="background: #f0f4ff; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <p style="margin: 0 0 8px;"><strong>📅 Date & Time:</strong><br>${sessionDate}</p>
            <p style="margin: 0 0 8px;"><strong>⏱ Duration:</strong> ${session.ends_at ? Math.round((new Date(session.ends_at).getTime() - new Date(session.scheduled_at).getTime()) / 60000) : 60} minutes</p>
          </div>

          <a href="${watchUrl}"
             style="display: inline-block; background: #2563eb; color: white; padding: 14px 28px;
                    border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0;">
            Watch the Webinar
          </a>

          <p style="color: #666; font-size: 14px;">
            This link is unique to you. Please do not share it with others.
          </p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
          <p style="color: #999; font-size: 12px;">
            You're receiving this because you registered at ${env.APP_URL}.<br>
            ${env.EMAIL_FROM_NAME}
          </p>
        </body>
        </html>
      `,
    });
  },

  async sendReminder(
    registrant: Registrant,
    webinar: Webinar,
    session: WebinarSession,
    timeframe: '24h' | '1h',
  ): Promise<void> {
    const watchUrl = `${env.APP_URL}/watch/${registrant.watch_token}`;
    const sessionDate = formatDate(session.scheduled_at);
    const label = timeframe === '24h' ? 'Tomorrow' : 'In 1 hour';
    const emoji = timeframe === '24h' ? '📅' : '⏰';

    await transporter.sendMail({
      from: `"${env.EMAIL_FROM_NAME}" <${env.EMAIL_FROM_ADDRESS}>`,
      to: registrant.email,
      subject: `${emoji} Reminder: ${webinar.title} starts ${label.toLowerCase()}`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h2 style="color: #2563eb;">${emoji} ${label}: ${webinar.title}</h2>
          <p>Hi ${registrant.first_name},</p>
          <p>Just a reminder that <strong>${webinar.title}</strong> is starting <strong>${label.toLowerCase()}</strong>.</p>

          <div style="background: #f0f4ff; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <p style="margin: 0 0 8px;"><strong>📅 Date & Time:</strong><br>${sessionDate}</p>
            <p style="margin: 0;"><strong>👤 Host:</strong> ${webinar.host_name}</p>
          </div>

          <a href="${watchUrl}"
             style="display: inline-block; background: #2563eb; color: white; padding: 14px 28px;
                    border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0;">
            Join the Webinar
          </a>

          <p style="color: #666; font-size: 14px;">
            Click the button above to access your unique watch link.
          </p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
          <p style="color: #999; font-size: 12px;">
            ${env.EMAIL_FROM_NAME} | ${env.APP_URL}
          </p>
        </body>
        </html>
      `,
    });
  },
};
