import sgMail from '@sendgrid/mail';
import { env } from '../config/env';

if (env.SENDGRID_API_KEY) {
  sgMail.setApiKey(env.SENDGRID_API_KEY);
}

export class EmailService {
  private static from = env.EMAIL_FROM || 'noreply@eventify.com';

  private static async send(msg: { to: string; subject: string; html: string; text: string }) {
    console.log(`[EMAIL] To: ${msg.to} | Subject: ${msg.subject}`);
    
    if (!env.SENDGRID_API_KEY) {
      console.warn('SENDGRID_API_KEY not set. Email not sent to SendGrid. Check logs for content.');
      return;
    }

    try {
      await sgMail.send({
        ...msg,
        from: this.from,
      });
    } catch (error: any) {
      console.error('[SENDGRID ERROR]', error.response?.body || error.message);
    }
  }

  // 1. Welcome (Signup)
  static async sendWelcomeEmail(to: string, name: string) {
    const subject = 'Welcome to EventiFy!';
    const html = `<h1>Welcome, ${name}!</h1><p>We're thrilled to have you on board. Start planning your perfect event today!</p>`;
    const text = `Welcome, ${name}! We're thrilled to have you on board.`;
    await this.send({ to, subject, html, text });
  }

  // 2. Password Reset
  static async sendPasswordReset(to: string, token: string) {
    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${token}`;
    const subject = 'Reset Your Password';
    const html = `<h1>Reset Your Password</h1><p>Click <a href="${resetUrl}">here</a> to reset your password. This link will expire in 1 hour.</p>`;
    const text = `Reset your password at: ${resetUrl}`;
    await this.send({ to, subject, html, text });
  }

  // 3. Booking Received (Vendor)
  static async sendBookingReceived(to: string, vendorName: string, eventName: string) {
    const subject = 'New Booking Request Received';
    const html = `<h1>Hello ${vendorName},</h1><p>You have a new booking request for the event: <strong>${eventName}</strong>. Check your dashboard to respond.</p>`;
    const text = `Hello ${vendorName}, you have a new booking request for the event: ${eventName}.`;
    await this.send({ to, subject, html, text });
  }

  // 4. Booking Accepted (Client)
  static async sendBookingAccepted(to: string, clientName: string, vendorName: string) {
    const subject = 'Your Booking Request was Accepted!';
    const html = `<h1>Great news, ${clientName}!</h1><p><strong>${vendorName}</strong> has accepted your booking request. Please proceed with the advance payment to secure the date.</p>`;
    const text = `Great news, ${clientName}! ${vendorName} has accepted your booking request.`;
    await this.send({ to, subject, html, text });
  }

  // 5. Booking Rejected (Client)
  static async sendBookingRejected(to: string, clientName: string, vendorName: string) {
    const subject = 'Update on your Booking Request';
    const html = `<h1>Hello ${clientName},</h1><p>We're sorry, but <strong>${vendorName}</strong> is unavailable for your selected date and has declined the request. You can explore other vendors on our platform.</p>`;
    const text = `Hello ${clientName}, ${vendorName} has declined your booking request.`;
    await this.send({ to, subject, html, text });
  }

  // 6. Advance Paid (Vendor)
  static async sendAdvancePaid(to: string, vendorName: string, eventName: string, amount: number) {
    const subject = 'Advance Payment Received';
    const html = `<h1>Hello ${vendorName},</h1><p>The advance payment of <strong>LKR ${amount.toLocaleString()}</strong> for <strong>${eventName}</strong> has been received. Your booking is now confirmed!</p>`;
    const text = `Hello ${vendorName}, the advance payment of LKR ${amount.toLocaleString()} for ${eventName} has been received.`;
    await this.send({ to, subject, html, text });
  }

  // 7. Final Payment Received (Vendor)
  static async sendFinalPaymentReceived(to: string, vendorName: string, eventName: string, amount: number) {
    const subject = 'Final Payment Received';
    const html = `<h1>Hello ${vendorName},</h1><p>The final payment of <strong>LKR ${amount.toLocaleString()}</strong> for <strong>${eventName}</strong> has been processed. Thank you for your service!</p>`;
    const text = `Hello ${vendorName}, the final payment of LKR ${amount.toLocaleString()} for ${eventName} has been processed.`;
    await this.send({ to, subject, html, text });
  }

  // 8. Task Updated (Client)
  static async sendTaskUpdated(to: string, clientName: string, vendorName: string, taskName: string, status: string) {
    const subject = `Task Update: ${taskName}`;
    const html = `<h1>Hello ${clientName},</h1><p><strong>${vendorName}</strong> has updated the status of <strong>${taskName}</strong> to: <strong>${status}</strong>.</p>`;
    const text = `Hello ${clientName}, ${vendorName} has updated the status of ${taskName} to: ${status}.`;
    await this.send({ to, subject, html, text });
  }

  // 9. New Message (Receiver)
  static async sendNewMessageAlert(to: string, receiverName: string, senderName: string) {
    const subject = 'New Message Received';
    const html = `<h1>Hello ${receiverName},</h1><p>You have received a new message from <strong>${senderName}</strong>. Log in to your account to reply.</p>`;
    const text = `Hello ${receiverName}, you have received a new message from ${senderName}.`;
    await this.send({ to, subject, html, text });
  }

  // 10. Vendor Approved (Vendor)
  static async sendVendorApproved(to: string, vendorName: string) {
    const subject = 'Welcome to EventiFy: Your Vendor Account is Approved!';
    const html = `<h1>Congratulations ${vendorName}!</h1><p>Your vendor profile has been reviewed and approved by our administrators. You can now start receiving booking requests and showcase your services to thousands of clients.</p>`;
    const text = `Congratulations ${vendorName}! Your vendor profile has been approved.`;
    await this.send({ to, subject, html, text });
  }

  // 11. Vendor Rejected (Vendor)
  static async sendVendorRejected(to: string, vendorName: string, reason?: string) {
    const subject = 'Update on your Vendor Application';
    const html = `<h1>Hello ${vendorName},</h1><p>After reviewing your application, we're unable to approve your vendor profile at this time.</p>${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}<p>You can contact our support team for more details.</p>`;
    const text = `Hello ${vendorName}, your vendor application was not approved. ${reason ? `Reason: ${reason}` : ''}`;
    await this.send({ to, subject, html, text });
  }

  // 12. Payout Processed (Vendor)
  static async sendPayoutProcessed(to: string, name: string, amount: number) {
    const subject = 'Your Payout has been Processed';
    const html = `<h1>Hello ${name},</h1><p>We've successfully processed your payout of <strong>LKR ${amount.toLocaleString()}</strong>. The funds should appear in your bank account shortly.</p>`;
    const text = `Hello ${name}, your payout of LKR ${amount.toLocaleString()} has been processed.`;
    await this.send({ to, subject, html, text });
  }

  // 13. Payout Failed (Vendor)
  static async sendPayoutFailed(to: string, name: string, amount: number) {
    const subject = 'Issue with your Payout';
    const html = `<h1>Hello ${name},</h1><p>There was an issue processing your payout of <strong>LKR ${amount.toLocaleString()}</strong>. Please ensure your bank details are correct in your profile settings. Our team will also reach out to assist you.</p>`;
    const text = `Hello ${name}, there was an issue processing your payout of LKR ${amount.toLocaleString()}.`;
    await this.send({ to, subject, html, text });
  }

  // 14. Test Email (Admin)
  static async sendTestEmail(to: string, adminName: string) {
    const subject = 'EventiFy Email System Loopback Test';
    const timestamp = new Date().toLocaleString();
    const html = `<h1>Loopback Test Successful</h1><p>Hello ${adminName},</p><p>This is a diagnostic test from the EventiFy Admin Console.</p><p><strong>Status:</strong> Active<br><strong>Timestamp:</strong> ${timestamp}</p>`;
    const text = `Loopback Test Successful. Hello ${adminName}, this is a diagnostic test from the EventiFy Admin Console. Timestamp: ${timestamp}`;
    await this.send({ to, subject, html, text });
  }
}

