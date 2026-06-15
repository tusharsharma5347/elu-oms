// src/lib/resend.ts
import { Resend } from 'resend';
import type { Order, AlertType } from '@/types';

// Lazy-initialized so the build doesn't fail if RESEND_API_KEY is absent
let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY ?? 'placeholder');
  }
  return _resend;
}
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'alerts@elu-oms.com';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export interface AlertEmailData {
  order: Order & { store?: { name: string } };
  alertType: AlertType;
  hoursOverdue?: number;
  hoursRemaining?: number;
  aiReasoning?: string;
  aiRecommendedAction?: string;
}

export async function sendBreachAlert(data: AlertEmailData): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Resend] API key not set — skipping email alert');
    return false;
  }

  const {
    order,
    alertType,
    hoursOverdue,
    hoursRemaining,
    aiReasoning,
    aiRecommendedAction,
  } = data;

  const storeName = order.store?.name ?? 'Unknown Store';
  const orderUrl = `${APP_URL}/orders/${order.id}`;

  const isBreached = alertType === 'SLA_BREACHED';
  const subjectPrefix = isBreached ? '🚨 SLA BREACHED' : '⚠️ SLA Breach Predicted';
  const subject = `${subjectPrefix}: Order ${order.order_number} — ${order.customer_name}`;

  const timeInfo = isBreached
    ? `<p style="color:#dc2626;font-weight:bold;">⛔ OVERDUE by ${hoursOverdue?.toFixed(1) ?? '?'} hours</p>`
    : `<p style="color:#d97706;font-weight:bold;">⏰ ${hoursRemaining?.toFixed(1) ?? '?'} hours remaining in SLA</p>`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#1a1a1a;">
  <div style="background:${isBreached ? '#fef2f2' : '#fffbeb'};border-left:4px solid ${isBreached ? '#dc2626' : '#d97706'};padding:16px;border-radius:8px;margin-bottom:24px;">
    <h1 style="margin:0 0 8px;font-size:20px;color:${isBreached ? '#dc2626' : '#d97706'};">${subjectPrefix}</h1>
    <p style="margin:0;color:#4b5563;">ELU Order Management System Alert</p>
  </div>
  
  <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
    <tr style="background:#f9fafb;">
      <td style="padding:10px;border:1px solid #e5e7eb;font-weight:600;width:40%;">Order Number</td>
      <td style="padding:10px;border:1px solid #e5e7eb;">${order.order_number}</td>
    </tr>
    <tr>
      <td style="padding:10px;border:1px solid #e5e7eb;font-weight:600;">Customer</td>
      <td style="padding:10px;border:1px solid #e5e7eb;">${order.customer_name}${order.customer_phone ? ` — ${order.customer_phone}` : ''}</td>
    </tr>
    <tr style="background:#f9fafb;">
      <td style="padding:10px;border:1px solid #e5e7eb;font-weight:600;">Store</td>
      <td style="padding:10px;border:1px solid #e5e7eb;">${storeName}</td>
    </tr>
    <tr>
      <td style="padding:10px;border:1px solid #e5e7eb;font-weight:600;">Current Status</td>
      <td style="padding:10px;border:1px solid #e5e7eb;"><strong>${order.status.replace(/_/g, ' ')}</strong></td>
    </tr>
    <tr style="background:#f9fafb;">
      <td style="padding:10px;border:1px solid #e5e7eb;font-weight:600;">Lens Type</td>
      <td style="padding:10px;border:1px solid #e5e7eb;">${order.lens_type} ${order.lens_index} — SLA: ${order.sla_hours}h</td>
    </tr>
    <tr>
      <td style="padding:10px;border:1px solid #e5e7eb;font-weight:600;">SLA Status</td>
      <td style="padding:10px;border:1px solid #e5e7eb;">${timeInfo}</td>
    </tr>
  </table>

  ${aiReasoning ? `
  <div style="background:#f0f9ff;border:1px solid #bae6fd;padding:16px;border-radius:8px;margin-bottom:24px;">
    <h3 style="margin:0 0 8px;font-size:14px;color:#0369a1;">🤖 AI Analysis</h3>
    <p style="margin:0 0 8px;color:#1e3a5f;">${aiReasoning}</p>
    ${aiRecommendedAction ? `<p style="margin:0;font-weight:600;color:#0369a1;">Recommended Action: ${aiRecommendedAction}</p>` : ''}
  </div>
  ` : ''}

  <a href="${orderUrl}" style="display:inline-block;background:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
    View Order Details →
  </a>

  <p style="margin-top:32px;font-size:12px;color:#9ca3af;">
    This alert was sent by ELU Order Management System. 
    Order ID: ${order.id}
  </p>
</body>
</html>`;

  const isPublicEmail = /@(gmail|yahoo|outlook|hotmail|icloud)\.com$/i.test(FROM_EMAIL);
  const mailSender = isPublicEmail ? 'onboarding@resend.dev' : FROM_EMAIL;
  const mailRecipient = FROM_EMAIL;

  try {
    const { error } = await getResend().emails.send({
      from: mailSender,
      to: [mailRecipient], // In production: send to store manager / ops team
      subject,
      html,
    });

    if (error) {
      console.error('[Resend] Send error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Resend] Unexpected error:', error);
    return false;
  }
}
