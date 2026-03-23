import sgMail from '@sendgrid/mail';
import { env } from '../config/env';

if (env.SENDGRID_API_KEY) {
  sgMail.setApiKey(env.SENDGRID_API_KEY);
}

// Map for rate limiting message emails
// Key: `${senderId}-${recipientId}`, Value: timestamp
export const messageEmailCache = new Map<string, number>();

export const sendEmail = async (to: string, subject: string, html: string) => {
  if (!env.SENDGRID_API_KEY) {
    console.warn('[Email] SENDGRID_API_KEY not set — skipping email to', to);
    return;
  }
  
  try {
    await sgMail.send({
      to,
      from: env.EMAIL_FROM!,
      subject,
      html
    });
  } catch (error) {
    console.error('[Email] Failed to send email to', to, error);
  }
};

export const sendMessageEmail = async (
  senderId: string, 
  recipientId: string, 
  toEmail: string, 
  subject: string, 
  html: string
) => {
  const key = `${senderId}-${recipientId}`;
  const lastSent = messageEmailCache.get(key) || 0;
  
  // 1 hour cooldown for message notifications between the same two users
  if (Date.now() - lastSent < 3600000) {
    return;
  }
  
  messageEmailCache.set(key, Date.now());
  await sendEmail(toEmail, subject, html);
};
