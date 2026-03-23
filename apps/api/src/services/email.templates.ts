import { env } from '../config/env';

const wrapHtml = (content: string, ctaLink?: string, ctaText?: string) => `
<div style="font-family:'Plus Jakarta Sans',Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#FAFAF9">
  <div style="background:#1C1917;padding:16px 24px;border-radius:8px 8px 0 0">
    <h1 style="color:#fff;font-size:20px;margin:0">EventiFy</h1>
  </div>
  <div style="background:#fff;border:1px solid #E7E5E4;padding:28px 24px;border-radius:0 0 8px 8px">
    ${content}
    ${ctaLink && ctaText ? `
      <div style="margin-top:24px;text-align:center">
        <a href="${ctaLink}" style="display:inline-block;background:#F43F5E;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:500;">
          ${ctaText}
        </a>
      </div>
    ` : ''}
  </div>
  <p style="color:#78716C;font-size:12px;text-align:center;margin-top:16px">
    You received this because you have an account on EventiFy.
  </p>
</div>
`;

export const emailTemplates = {
  // 1. Welcome Email
  welcomeEmail: (name: string) => ({
    subject: 'Welcome to EventiFy!',
    html: wrapHtml(
      `<p style="margin-top:0;font-size:16px;color:#1C1917">Hi ${name},</p>
       <p style="font-size:16px;color:#44403C;line-height:1.5">Welcome to EventiFy! We're thrilled to have you on board. Start exploring top vendors to make your dream event a reality.</p>`,
      `${env.FRONTEND_URL}/explore`,
      'Explore Vendors'
    )
  }),

  // 2. Vendor Approved Booking
  vendorApprovedBooking: (clientName: string, eventName: string, vendorName: string, eventDate: string) => ({
    subject: `Booking Confirmed: ${vendorName}`,
    html: wrapHtml(
      `<p style="margin-top:0;font-size:16px;color:#1C1917">Hi ${clientName},</p>
       <p style="font-size:16px;color:#44403C;line-height:1.5">Great news! <strong>${vendorName}</strong> has accepted your booking request for <strong>${eventName}</strong> on ${new Date(eventDate).toLocaleDateString()}.</p>
       <p style="font-size:16px;color:#44403C;line-height:1.5">You can now proceed to pay the advance to secure them.</p>`,
      `${env.FRONTEND_URL}/events`,
      'View Event'
    )
  }),

  // 3. Vendor Rejected Booking
  vendorRejectedBooking: (clientName: string, eventName: string, vendorName: string) => ({
    subject: `Booking Update: ${vendorName}`,
    html: wrapHtml(
      `<p style="margin-top:0;font-size:16px;color:#1C1917">Hi ${clientName},</p>
       <p style="font-size:16px;color:#44403C;line-height:1.5">Unfortunately, <strong>${vendorName}</strong> is unable to accept your booking request for <strong>${eventName}</strong> at this time.</p>
       <p style="font-size:16px;color:#44403C;line-height:1.5">Don't worry! There are many other amazing vendors waiting to help you.</p>`,
      `${env.FRONTEND_URL}/explore`,
      'Find New Vendors'
    )
  }),

  // 4. Advance Payment Required
  advancePaymentRequired: (clientName: string, eventName: string, amount: string, dueDate: string) => ({
    subject: `Advance Payment Required for ${eventName}`,
    html: wrapHtml(
      `<p style="margin-top:0;font-size:16px;color:#1C1917">Hi ${clientName},</p>
       <p style="font-size:16px;color:#44403C;line-height:1.5">Your vendors for <strong>${eventName}</strong> require an advance payment of <strong>LKR ${amount}</strong> to secure their services.</p>`,
      `${env.FRONTEND_URL}/events`,
      'Pay Advance Now'
    )
  }),

  // 5. Advance Payment Received (to Vendor)
  advancePaymentReceived: (vendorName: string, clientName: string, eventName: string, amount: string) => ({
    subject: `Payment Received: ${eventName}`,
    html: wrapHtml(
      `<p style="margin-top:0;font-size:16px;color:#1C1917">Hi ${vendorName},</p>
       <p style="font-size:16px;color:#44403C;line-height:1.5"><strong>${clientName}</strong> has completed the advance payment for <strong>${eventName}</strong>.</p>
       <p style="font-size:16px;color:#44403C;line-height:1.5">An amount of <strong>LKR ${amount}</strong> has been secured and your 40% vendor share is queued for payout.</p>`,
      `${env.FRONTEND_URL}/transactions`,
      'View Transaction'
    )
  }),

  // 6. Admin Paid Vendor Commission
  adminPaidVendorCommission: (vendorName: string, amount: string, eventName: string) => ({
    subject: `Payout Processed: LKR ${amount}`,
    html: wrapHtml(
      `<p style="margin-top:0;font-size:16px;color:#1C1917">Hi ${vendorName},</p>
       <p style="font-size:16px;color:#44403C;line-height:1.5">EventiFy has processed a payout of <strong>LKR ${amount}</strong> for your services at <strong>${eventName}</strong>.</p>
       <p style="font-size:16px;color:#44403C;line-height:1.5">Funds should arrive in your bank account in 1-2 business days.</p>`,
      `${env.FRONTEND_URL}/transactions`,
      'View Payout History'
    )
  }),

  // 7. Remaining Payment Required
  remainingPaymentRequired: (clientName: string, eventName: string, amount: string) => ({
    subject: `Final Payment Due for ${eventName}`,
    html: wrapHtml(
      `<p style="margin-top:0;font-size:16px;color:#1C1917">Hi ${clientName},</p>
       <p style="font-size:16px;color:#44403C;line-height:1.5">Your event <strong>${eventName}</strong> has concluded. The final remaining balance of <strong>LKR ${amount}</strong> is now due.</p>`,
      `${env.FRONTEND_URL}/events`,
      'Complete Payment'
    )
  }),

  // 8. Event Soon Reminder
  eventSoonReminder: (recipientName: string, eventName: string, eventDate: string, daysUntil: number, isVendor: boolean = false) => ({
    subject: `Reminder: ${eventName} is in ${daysUntil} days!`,
    html: wrapHtml(
      `<p style="margin-top:0;font-size:16px;color:#1C1917">Hi ${recipientName},</p>
       <p style="font-size:16px;color:#44403C;line-height:1.5">Get ready! <strong>${eventName}</strong> is happening on ${new Date(eventDate).toLocaleDateString()}, which is just ${daysUntil} days away.</p>
       <p style="font-size:16px;color:#44403C;line-height:1.5">Log in to check messages, review tasks, and ensure everything is set.</p>`,
      `${env.FRONTEND_URL}/${isVendor ? 'services' : 'events'}`,
      'View details'
    )
  }),

  // 9. Task Completed
  taskCompleted: (clientName: string, vendorName: string, taskTitle: string, eventName: string) => ({
    subject: `Task Update: ${vendorName} finished a task`,
    html: wrapHtml(
      `<p style="margin-top:0;font-size:16px;color:#1C1917">Hi ${clientName},</p>
       <p style="font-size:16px;color:#44403C;line-height:1.5">Good news! <strong>${vendorName}</strong> has marked the task <strong>"${taskTitle}"</strong> as completed for ${eventName}.</p>`,
      `${env.FRONTEND_URL}/events`,
      'Check Progress'
    )
  }),

  // 10. Forgot Password
  forgotPassword: (name: string, resetLink: string) => ({
    subject: 'Reset your EventiFy password',
    html: wrapHtml(
      `<p style="margin-top:0;font-size:16px;color:#1C1917">Hi ${name},</p>
       <p style="font-size:16px;color:#44403C;line-height:1.5">We received a request to reset your EventiFy password. Click the button below to choose a new password. This link expires in 1 hour.</p>
       <p style="font-size:14px;color:#78716C;margin-top:24px">If you didn't request this, you can safely ignore this email.</p>`,
      resetLink,
      'Reset Password'
    )
  }),

  // 11. New Message
  newMessageNotification: (recipientName: string, senderName: string, preview: string) => ({
    subject: `New message from ${senderName}`,
    html: wrapHtml(
      `<p style="margin-top:0;font-size:16px;color:#1C1917">Hi ${recipientName},</p>
       <p style="font-size:16px;color:#44403C;line-height:1.5">You have a new message from <strong>${senderName}</strong>:</p>
       <blockquote style="border-left:4px solid #F43F5E;padding-left:16px;margin-left:0;color:#78716C;font-style:italic">"${preview}"</blockquote>`,
      `${env.FRONTEND_URL}/messages`,
      'Reply in App'
    )
  })
};
