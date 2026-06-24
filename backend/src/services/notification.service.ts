import nodemailer from 'nodemailer';
import { NotificationTemplate } from '../models/NotificationTemplate';
import { env } from '../config/env';

interface SendNotificationParams {
  trigger: string;
  recipient: { email?: string; phone?: string; userId?: string };
  variables: Record<string, string>;
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST || 'smtp.ethereal.email',
      port: parseInt(env.SMTP_PORT || '587'),
      secure: env.SMTP_SECURE === 'true',
      auth: {
        user: env.SMTP_USER || '',
        pass: env.SMTP_PASS || '',
      },
    });
  }
  return transporter;
}

function interpolate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] || `{{${key}}}`);
}

export async function sendNotification(params: SendNotificationParams): Promise<void> {
  const template = await NotificationTemplate.findOne({ trigger: params.trigger, isActive: true });
  if (!template) {
    console.warn(`No active notification template for trigger: ${params.trigger}`);
    return;
  }

  const title = interpolate(template.title, params.variables);
  const body = interpolate(template.body, params.variables);

  // Email
  if (template.channels.email && params.recipient.email && template.emailSubject) {
    try {
      const html = template.emailHtml
        ? interpolate(template.emailHtml, params.variables)
        : `<p>${body.replace(/\n/g, '<br/>')}</p>`;

      await getTransporter().sendMail({
        from: env.SMTP_FROM || 'noreply@shopyng.com',
        to: params.recipient.email,
        subject: interpolate(template.emailSubject, params.variables),
        html,
      });
      console.log(`Email sent to ${params.recipient.email} for trigger: ${params.trigger}`);
    } catch (err) {
      console.error(`Failed to send email for trigger ${params.trigger}:`, err);
    }
  }

  // SMS
  if (template.channels.sms && params.recipient.phone) {
    try {
      const smsBody = template.smsBody
        ? interpolate(template.smsBody, params.variables)
        : body;
      // Placeholder: integrate with SMS provider (e.g., Twilio, AWS SNS)
      console.log(`SMS to ${params.recipient.phone}: ${smsBody}`);
    } catch (err) {
      console.error(`Failed to send SMS for trigger ${params.trigger}:`, err);
    }
  }

  // Push (placeholder for FCM/Web Push)
  if (template.channels.push) {
    console.log(`Push notification for user ${params.recipient.userId}: ${title}`);
  }
}

export async function sendOrderConfirmation(order: any): Promise<void> {
  await sendNotification({
    trigger: 'order:confirmed',
    recipient: { userId: order.userId },
    variables: {
      orderId: order._id,
      amount: String(order.total),
      paymentMethod: order.paymentMethod,
    },
  });
}

export async function sendOrderShipped(order: any): Promise<void> {
  await sendNotification({
    trigger: 'order:shipped',
    recipient: { userId: order.userId },
    variables: {
      orderId: order._id,
      trackingId: order.trackingId || 'N/A',
    },
  });
}

export async function sendOrderDelivered(order: any): Promise<void> {
  await sendNotification({
    trigger: 'order:delivered',
    recipient: { userId: order.userId },
    variables: {
      orderId: order._id,
    },
  });
}

export async function sendPayoutNotification(vendorId: string, amount: number): Promise<void> {
  await sendNotification({
    trigger: 'payout:processed',
    recipient: { userId: vendorId },
    variables: {
      amount: String(amount),
    },
  });
}

export async function sendReturnUpdate(returnRequest: any): Promise<void> {
  await sendNotification({
    trigger: 'return:status_changed',
    recipient: { userId: returnRequest.userId },
    variables: {
      returnId: returnRequest._id,
      status: returnRequest.status,
      orderId: returnRequest.orderId,
    },
  });
}
