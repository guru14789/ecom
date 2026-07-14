import PDFDocument from 'pdfkit';
import { Order } from '../lib/firestore/orders';
import { getUserById } from '../lib/firestore/users';

export async function generateInvoicePDF(order: Order, type: 'buyer' | 'vendor', vendorId?: string): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Header
      doc
        .fillColor('#333333')
        .fontSize(20)
        .text('SHOPSYY', 50, 57)
        .fontSize(10)
        .text('Tax Invoice', 50, 80)
        .fontSize(10)
        .text(`Order ID: ${order.id}`, 50, 95)
        .text(`Date: ${order.createdAt.toDate().toLocaleDateString()}`, 50, 110)
        .text(`Payment: ${order.paymentMethod.toUpperCase()} (${order.paymentStatus})`, 50, 125);

      // Addresses
      doc.fontSize(12).text('Billed To:', 50, 160);
      const buyer = await getUserById(order.userId);
      const buyerName = buyer?.name || 'Customer';
      
      doc.fontSize(10)
        .text(buyerName, 50, 175)
        .text(order.deliveryAddress.houseNo, 50, 190)
        .text(`${order.deliveryAddress.area}, ${order.deliveryAddress.city || ''}`, 50, 205)
        .text(`${order.deliveryAddress.state || ''} - ${order.deliveryAddress.pincode}`, 50, 220);

      // Table Header
      let y = 270;
      doc.font('Helvetica-Bold');
      doc.text('Item', 50, y);
      doc.text('Qty', 300, y);
      doc.text('Price', 350, y);
      doc.text('Tax', 420, y);
      doc.text('Total', 480, y);
      
      doc.moveTo(50, y + 15).lineTo(550, y + 15).stroke();
      doc.font('Helvetica');
      y += 25;

      let subtotal = 0;
      let taxTotal = 0;

      // Filter items if it's a vendor invoice
      const itemsToPrint = type === 'vendor' && vendorId 
        ? order.items.filter(i => i.vendorId === vendorId)
        : order.items;

      itemsToPrint.forEach(item => {
        const itemTax = item.taxAmount || 0;
        const total = item.totalPrice;
        const price = total / item.quantity;
        
        doc.text(item.productSnapshot.name as string, 50, y, { width: 240 });
        doc.text(item.quantity.toString(), 300, y);
        doc.text(`Rs. ${price.toFixed(2)}`, 350, y);
        doc.text(`Rs. ${itemTax.toFixed(2)}`, 420, y);
        doc.text(`Rs. ${total.toFixed(2)}`, 480, y);

        subtotal += total - itemTax;
        taxTotal += itemTax;
        y += 20;
      });

      doc.moveTo(50, y).lineTo(550, y).stroke();
      y += 15;

      // Totals
      doc.font('Helvetica-Bold');
      if (type === 'buyer') {
        doc.text(`Subtotal: Rs. ${order.subtotal.toFixed(2)}`, 400, y);
        y += 15;
        doc.text(`Tax Total: Rs. ${order.taxTotal.toFixed(2)}`, 400, y);
        y += 15;
        if (order.deliveryFee > 0) {
          doc.text(`Delivery Fee: Rs. ${order.deliveryFee.toFixed(2)}`, 400, y);
          y += 15;
        }
        if (order.handlingFee > 0) {
          doc.text(`Handling Fee: Rs. ${order.handlingFee.toFixed(2)}`, 400, y);
          y += 15;
        }
        doc.fontSize(14).text(`Grand Total: Rs. ${order.total.toFixed(2)}`, 380, y + 10);
      } else {
        doc.text(`Vendor Subtotal: Rs. ${subtotal.toFixed(2)}`, 400, y);
        y += 15;
        doc.text(`Tax Total: Rs. ${taxTotal.toFixed(2)}`, 400, y);
        y += 15;
        doc.fontSize(14).text(`Total: Rs. ${(subtotal + taxTotal).toFixed(2)}`, 380, y + 10);
      }

      // Footer
      doc.font('Helvetica').fontSize(10);
      doc.text('Thank you for shopping with Shopsyy!', 50, 700, { align: 'center', width: 500 });
      doc.text('This is a computer generated invoice and does not require a physical signature.', 50, 715, { align: 'center', width: 500 });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
