/**
 * Email Notification Service (Mock)
 * In a real environment, you would integrate Nodemailer + SendGrid/AWS SES here.
 */

export const sendOrderConfirmation = async (email: string, orderId: string, total: number) => {
  console.log(`\n[EMAIL MOCK] 📧 Sending Order Confirmation to ${email}`);
  console.log(`Subject: Your Shopsyy Order #${orderId.slice(-8)} is Confirmed!`);
  console.log(`Body: Thank you for your order! Your total is ₹${total}. We are processing it now.\n`);
};

export const sendShippingUpdate = async (
  email: string,
  orderId: string,
  courierName: string,
  awb: string,
  trackingUrl: string
) => {
  console.log(`\n[EMAIL MOCK] 📧 Sending Shipping Update to ${email}`);
  console.log(`Subject: Your Order #${orderId.slice(-8)} has been Shipped!`);
  console.log(`Body: Good news! Your order is on the way via ${courierName}.`);
  console.log(`Tracking ID: ${awb}`);
  console.log(`Track here: ${trackingUrl}\n`);
};

export const sendReturnUpdate = async (email: string, orderId: string, status: 'approved' | 'rejected') => {
  console.log(`\n[EMAIL MOCK] 📧 Sending Return Update to ${email}`);
  console.log(`Subject: Update on your Return Request for Order #${orderId.slice(-8)}`);
  console.log(`Body: Your return request has been ${status.toUpperCase()}. ${status === 'approved' ? 'Your refund will be processed soon.' : 'Please contact support for more details.'}\n`);
};
