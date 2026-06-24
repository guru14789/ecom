import PDFDocument from 'pdfkit';
import { Order } from '../models/Order';

export function generateOrderInvoice(order: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text('INVOICE', { align: 'right' });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').text(`Order #${order._id}`, { align: 'right' });
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`, { align: 'right' });
    doc.moveDown(1);

    // Company info
    doc.fontSize(12).font('Helvetica-Bold').text('ShopYNG Marketplace');
    doc.fontSize(9).font('Helvetica').text('123 Commerce Street');
    doc.text('GSTIN: 29ABCDE1234F1Z5');
    doc.moveDown(1);

    // Billing address
    doc.fontSize(11).font('Helvetica-Bold').text('Bill To:');
    doc.fontSize(9).font('Helvetica');
    const addr = order.deliveryAddress || {};
    doc.text(`${addr.houseNo || ''}, ${addr.area || ''}`);
    doc.text(`${addr.city || ''}, ${addr.state || ''} - ${addr.pincode || ''}`);
    doc.moveDown(1);

    // Line separator
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#cccccc');
    doc.moveDown(0.5);

    // Table header
    const tableTop = doc.y;
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('Item', 50, tableTop, { width: 250 });
    doc.text('Qty', 310, tableTop, { width: 50, align: 'center' });
    doc.text('Price', 370, tableTop, { width: 80, align: 'right' });
    doc.text('Total', 460, tableTop, { width: 80, align: 'right' });
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#cccccc');
    doc.moveDown(0.5);

    let y = doc.y;
    (order.items || []).forEach((item: any) => {
      doc.fontSize(9).font('Helvetica');
      const name = item.productSnapshot?.name || item.productId || 'Item';
      const truncated = name.length > 35 ? name.substring(0, 35) + '...' : name;
      doc.text(truncated, 50, y, { width: 250 });
      doc.text(String(item.quantity || 1), 310, y, { width: 50, align: 'center' });
      doc.text(`₹${(item.unitPrice || 0).toLocaleString('en-IN')}`, 370, y, { width: 80, align: 'right' });
      doc.text(`₹${(item.totalPrice || 0).toLocaleString('en-IN')}`, 460, y, { width: 80, align: 'right' });
      y += 18;
    });

    // Totals
    doc.moveDown(1);
    doc.moveTo(350, doc.y).lineTo(545, doc.y).stroke('#cccccc');
    doc.moveDown(0.5);

    const rightX = 460;
    const labelX = 370;
    y = doc.y;

    doc.fontSize(9).font('Helvetica');
    doc.text('Subtotal:', labelX, y, { width: 80, align: 'right' });
    doc.text(`₹${(order.subtotal || 0).toLocaleString('en-IN')}`, rightX, y, { width: 80, align: 'right' });
    y += 16;

    if (order.discount > 0) {
      doc.text('Discount:', labelX, y, { width: 80, align: 'right' });
      doc.text(`-₹${(order.discount || 0).toLocaleString('en-IN')}`, rightX, y, { width: 80, align: 'right' });
      y += 16;
    }

    doc.text('Delivery:', labelX, y, { width: 80, align: 'right' });
    doc.text(order.deliveryFee === 0 ? 'FREE' : `₹${(order.deliveryFee || 0).toLocaleString('en-IN')}`, rightX, y, { width: 80, align: 'right' });
    y += 16;

    doc.fontSize(11).font('Helvetica-Bold');
    doc.text('Total:', labelX, y, { width: 80, align: 'right' });
    doc.text(`₹${(order.total || 0).toLocaleString('en-IN')}`, rightX, y, { width: 80, align: 'right' });
    y += 20;

    // Payment info
    doc.moveDown(1);
    doc.fontSize(9).font('Helvetica');
    doc.text(`Payment Method: ${order.paymentMethod?.toUpperCase() || 'N/A'}`);
    doc.text(`Payment Status: ${order.paymentStatus || 'N/A'}`);
    if (order.trackingId) doc.text(`Tracking ID: ${order.trackingId}`);
    if (order.estimatedDelivery) doc.text(`Estimated Delivery: ${new Date(order.estimatedDelivery).toLocaleDateString('en-IN')}`);

    // Footer
    doc.moveDown(2);
    doc.fontSize(8).font('Helvetica').fillColor('#888888');
    doc.text('Thank you for shopping with ShopYNG!', 50, doc.y, { align: 'center' });
    doc.text('This is a computer-generated invoice.', 50, doc.y + 12, { align: 'center' });

    doc.end();
  });
}

export function generatePaymentInvoice(
  payment: { id: string; amount: number; status: string; method: string; createdAt: Date; vendorName?: string }
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    doc.fontSize(20).font('Helvetica-Bold').text('PAYMENT RECEIPT', { align: 'right' });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').text(`Receipt #${payment.id}`, { align: 'right' });
    doc.text(`Date: ${new Date(payment.createdAt).toLocaleDateString('en-IN')}`, { align: 'right' });
    doc.moveDown(1);

    doc.fontSize(12).font('Helvetica-Bold').text('ShopYNG Marketplace');
    doc.fontSize(9).font('Helvetica').text('123 Commerce Street');
    doc.moveDown(1);

    if (payment.vendorName) {
      doc.fontSize(11).font('Helvetica-Bold').text('Vendor:');
      doc.fontSize(9).font('Helvetica').text(payment.vendorName);
      doc.moveDown(0.5);
    }

    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#cccccc');
    doc.moveDown(0.5);

    const y = doc.y;
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Amount:', 50, y);
    doc.text(`₹${(payment.amount || 0).toLocaleString('en-IN')}`, 300, y, { align: 'right' });
    doc.moveDown(1.5);

    doc.fontSize(9).font('Helvetica');
    doc.text(`Status: ${payment.status.toUpperCase()}`);
    doc.text(`Method: ${payment.method.toUpperCase()}`);

    doc.moveDown(2);
    doc.fontSize(8).font('Helvetica').fillColor('#888888');
    doc.text('Thank you for using ShopYNG!', 50, doc.y, { align: 'center' });

    doc.end();
  });
}
