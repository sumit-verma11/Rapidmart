import nodemailer from "nodemailer";
import { formatPrice } from "./utils";

interface OrderItem {
  name: string;
  qty: number;
  price: number;
  variantSku: string;
}

interface SendOrderConfirmationParams {
  to: string;
  customerName: string;
  orderNumber: string;
  items: OrderItem[];
  deliveryAddress: { street: string; city: string; state: string; pincode: string };
  totalMRP: number;
  totalDiscount: number;
  deliveryCharge: number;
  grandTotal: number;
  estimatedDelivery: { minHours: number; maxHours: number };
}

function getTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

export async function sendOrderConfirmation(params: SendOrderConfirmationParams) {
  const {
    to, customerName, orderNumber, items,
    deliveryAddress, totalMRP, totalDiscount,
    deliveryCharge, grandTotal, estimatedDelivery,
  } = params;

  const itemRows = items.map((item) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;">
        <span style="font-weight:600;color:#111;">${item.name}</span>
        <br/>
        <span style="font-size:12px;color:#888;">${item.variantSku} · Qty ${item.qty}</span>
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:600;color:#111;">
        ${formatPrice(item.price * item.qty)}
      </td>
    </tr>
  `).join("");

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#16a34a,#166534);padding:28px 32px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:24px;font-weight:800;letter-spacing:-0.5px;">RapidMart</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Your order is confirmed! 🎉</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:28px 32px;">
            <p style="margin:0 0 6px;font-size:16px;color:#111;">Hi <strong>${customerName}</strong>,</p>
            <p style="margin:0 0 24px;color:#555;font-size:14px;line-height:1.6;">
              We've received your order and it's being prepared for delivery.
            </p>

            <!-- Order info -->
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px 18px;margin-bottom:24px;">
              <p style="margin:0;font-size:13px;color:#555;">Order Number</p>
              <p style="margin:4px 0 0;font-size:18px;font-weight:800;color:#16a34a;font-family:monospace;">#${orderNumber}</p>
            </div>

            <!-- Items -->
            <p style="margin:0 0 12px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#888;">Items Ordered</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
              ${itemRows}
            </table>

            <!-- Price breakdown -->
            <div style="background:#fafafa;border-radius:10px;padding:16px 18px;margin-bottom:24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:4px 0;font-size:13px;color:#888;">MRP Total</td>
                  <td style="padding:4px 0;font-size:13px;color:#888;text-align:right;">${formatPrice(totalMRP)}</td>
                </tr>
                ${totalDiscount > 0 ? `
                <tr>
                  <td style="padding:4px 0;font-size:13px;color:#16a34a;">Discount</td>
                  <td style="padding:4px 0;font-size:13px;color:#16a34a;text-align:right;">− ${formatPrice(totalDiscount)}</td>
                </tr>` : ""}
                <tr>
                  <td style="padding:4px 0;font-size:13px;color:#888;">Delivery</td>
                  <td style="padding:4px 0;font-size:13px;color:#888;text-align:right;">${deliveryCharge > 0 ? formatPrice(deliveryCharge) : "Free"}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0 4px;font-size:15px;font-weight:800;color:#111;border-top:1px solid #e5e7eb;">Grand Total</td>
                  <td style="padding:10px 0 4px;font-size:15px;font-weight:800;color:#16a34a;text-align:right;border-top:1px solid #e5e7eb;">${formatPrice(grandTotal)}</td>
                </tr>
                <tr>
                  <td colspan="2" style="font-size:12px;color:#aaa;text-align:center;padding-top:6px;">Payment: Cash on Delivery (COD)</td>
                </tr>
              </table>
            </div>

            <!-- Delivery -->
            <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:14px 18px;margin-bottom:24px;">
              <p style="margin:0;font-size:13px;font-weight:700;color:#92400e;">⚡ Estimated Delivery</p>
              <p style="margin:4px 0 0;font-size:14px;color:#111;">
                Within <strong>${estimatedDelivery.minHours}–${estimatedDelivery.maxHours} hours</strong>
              </p>
              <p style="margin:6px 0 0;font-size:13px;color:#555;">
                ${deliveryAddress.street}, ${deliveryAddress.city}, ${deliveryAddress.state} — ${deliveryAddress.pincode}
              </p>
            </div>

            <p style="margin:0;font-size:13px;color:#555;line-height:1.6;">
              Questions? Contact us at
              <a href="mailto:${process.env.GMAIL_USER}" style="color:#16a34a;">${process.env.GMAIL_USER}</a>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #f0f0f0;padding:18px 32px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#aaa;">© ${new Date().getFullYear()} RapidMart. All rights reserved.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const transporter = getTransporter();
  return transporter.sendMail({
    from: `"RapidMart" <${process.env.GMAIL_USER}>`,
    to,
    subject: `Order Confirmed #${orderNumber} — RapidMart`,
    html,
  });
}
