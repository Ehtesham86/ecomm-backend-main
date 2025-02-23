const PDFDocument = require('pdfkit');

async function createInvoicePDF(orders, address, instructions, paymentMethod) {
    const doc = new PDFDocument();
    const buffers = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {});

    doc.fontSize(20).text('Order Invoice', { align: 'center' });
    doc.moveDown();

    doc.fontSize(12).text(`Delivery Address: ${address}`);
    doc.text(`Delivery Instructions: ${instructions}`);
    doc.text(`Payment Method: ${paymentMethod}`);
    doc.moveDown();

    orders.forEach(order => {
        doc.fontSize(14).text(`Supplier: ${order.supplier}`);
        doc.fontSize(12).text(`Delivery Date: ${order.deliveryDate}`);
        doc.text(`Products:`);
        order.products.forEach(product => {
            doc.text(`- ${product.name} x${product.quantity} (£${product.price} each)`);
        });
        doc.moveDown();
    });

    doc.end();

    return Buffer.concat(buffers);
}

module.exports = { createInvoicePDF };
