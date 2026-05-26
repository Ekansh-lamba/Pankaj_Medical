const PDFDocument = require('pdfkit');
const cloudinary = require('../config/cloudinary');

/**
 * Generates a beautifully-designed, GST-compliant PDF invoice and uploads it to Cloudinary.
 * @param {object} order - Mongoose Order document populated with customer details.
 * @returns {Promise<string>} Cloudinary secure URL of the generated PDF invoice.
 */
exports.generateAndUploadInvoice = async (order) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', async () => {
        try {
          const pdfBuffer = Buffer.concat(buffers);
          const secureUrl = await new Promise((res, rej) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              {
                folder: 'pankaj-medical/invoices',
                public_id: `INV-${order.orderNumber}`,
                resource_type: 'raw',
                format: 'pdf'
              },
              (err, uploadResult) => {
                if (uploadResult) {
                  res(uploadResult.secure_url);
                } else {
                  rej(err || new Error('Cloudinary upload returned null result.'));
                }
              }
            );
            uploadStream.end(pdfBuffer);
          });
          resolve(secureUrl);
        } catch (uploadErr) {
          reject(uploadErr);
        }
      });

      // --- PDF Layout & Styling ---
      const pharmacyDetails = {
        name: 'PANKAJ MEDICAL AND GENERAL STORES',
        address: '133/17 M Block, Kidwainagar, Kanpur Nagar, UP',
        gstin: '09ACPPL2448G1ZB'
      };

      // 1. Header (Brand Identity)
      doc.rect(0, 0, doc.page.width, 110).fill('#0f766e'); // Teal-700
      doc
        .fillColor('#ffffff')
        .fontSize(20)
        .font('Helvetica-Bold')
        .text(pharmacyDetails.name, 50, 30);

      doc
        .fontSize(9)
        .font('Helvetica')
        .text(pharmacyDetails.address, 50, 60)
        .text('Phone: +91-9936162391 | Email: pankajmedicalstores.alerts@gmail.com', 50, 75)
        .text(`GSTIN: ${pharmacyDetails.gstin}`, 50, 90);

      // 2. Invoice Meta Info
      doc.fillColor('#1e293b');
      doc.fontSize(16).font('Helvetica-Bold').text('TAX INVOICE / BILL OF SUPPLY', 50, 130);

      doc
        .fontSize(10)
        .font('Helvetica')
        .text(`Invoice No: INV-${order.orderNumber}`, 50, 155)
        .text(`Order Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`, 50, 170)
        .text(
          `Payment Method: ${order.payment.method.toUpperCase()} (${order.payment.status.toUpperCase()})`,
          50,
          185
        );

      // Billing Information
      doc.font('Helvetica-Bold').text('BILL TO:', 320, 130);

      doc
        .font('Helvetica')
        .text(`Customer: ${order.customer?.name || 'Walk-in Customer'}`, 320, 145)
        .text(`Phone: ${order.customer?.phone || 'N/A'}`, 320, 160);

      if (order.deliveryType === 'delivery' && order.deliveryAddress) {
        const addr = order.deliveryAddress;
        doc.text(
          `Address: ${addr.line1}, ${addr.line2 ? addr.line2 + ', ' : ''}${addr.city}, ${addr.state} - ${addr.pinCode}`,
          320,
          175,
          { width: 230 }
        );
      } else {
        doc.text('Pickup: Self-Pickup from Kidwainagar Store', 320, 175);
      }

      // Draw horizontal divider line
      doc.moveTo(50, 225).lineTo(545, 225).strokeColor('#cbd5e1').lineWidth(1).stroke();

      // 3. Items Table Header
      const tableTop = 240;
      doc.fillColor('#0f766e').font('Helvetica-Bold').fontSize(9);

      doc
        .text('S.No', 50, tableTop)
        .text('Item Description', 85, tableTop)
        .text('HSN', 260, tableTop)
        .text('GST %', 305, tableTop)
        .text('Qty', 355, tableTop)
        .text('MRP (ea)', 395, tableTop)
        .text('Discount', 455, tableTop)
        .text('Total', 505, tableTop, { align: 'right', width: 40 });

      doc
        .moveTo(50, tableTop + 15)
        .lineTo(545, tableTop + 15)
        .strokeColor('#e2e8f0')
        .lineWidth(1)
        .stroke();

      // 4. Render Table Items
      let currentHeight = tableTop + 25;
      doc.fillColor('#334155').font('Helvetica');

      order.items.forEach((item, idx) => {
        if (currentHeight > 700) {
          doc.addPage();
          currentHeight = 50;
        }

        const itemTotal = item.sellingPrice * item.quantity;
        const discountAmount = (item.mrp - item.sellingPrice) * item.quantity;

        doc
          .text(String(idx + 1), 50, currentHeight)
          .font('Helvetica-Bold')
          .text(item.name, 85, currentHeight, { width: 170 })
          .font('Helvetica')
          .text(item.hsnCode || '3004', 260, currentHeight)
          .text(`${item.gstRate || 12}%`, 305, currentHeight)
          .text(String(item.quantity), 355, currentHeight)
          .text(`₹${item.mrp.toFixed(2)}`, 395, currentHeight)
          .text(discountAmount > 0 ? `₹${discountAmount.toFixed(2)}` : '₹0.00', 455, currentHeight)
          .font('Helvetica-Bold')
          .text(`₹${itemTotal.toFixed(2)}`, 500, currentHeight, { align: 'right', width: 45 });

        currentHeight += 20;
      });

      doc
        .moveTo(50, currentHeight)
        .lineTo(545, currentHeight)
        .strokeColor('#cbd5e1')
        .lineWidth(1)
        .stroke();

      // 5. GST Split Computations
      const gstSummary = {};
      order.items.forEach((item) => {
        const rate = item.gstRate || 12;
        const itemTotal = item.sellingPrice * item.quantity;
        const gstAmount = itemTotal * (rate / (100 + rate));
        const taxableValue = itemTotal - gstAmount;

        if (!gstSummary[rate]) {
          gstSummary[rate] = { taxable: 0, cgst: 0, sgst: 0, totalTax: 0 };
        }
        gstSummary[rate].taxable += taxableValue;
        gstSummary[rate].cgst += gstAmount / 2;
        gstSummary[rate].sgst += gstAmount / 2;
        gstSummary[rate].totalTax += gstAmount;
      });

      let gstHeight = currentHeight + 20;
      if (gstHeight > 700) {
        doc.addPage();
        gstHeight = 50;
      }
      doc
        .fillColor('#0f766e')
        .font('Helvetica-Bold')
        .fontSize(10)
        .text('GST Tax Breakup:', 50, gstHeight);

      gstHeight += 15;
      doc
        .fillColor('#475569')
        .fontSize(8)
        .text('GST Rate', 50, gstHeight)
        .text('Taxable Val', 105, gstHeight)
        .text('CGST Rate', 175, gstHeight)
        .text('CGST Amt', 235, gstHeight)
        .text('SGST Rate', 305, gstHeight)
        .text('SGST Amt', 365, gstHeight)
        .text('Total Tax', 435, gstHeight);

      doc
        .moveTo(50, gstHeight + 10)
        .lineTo(500, gstHeight + 10)
        .strokeColor('#e2e8f0')
        .lineWidth(0.5)
        .stroke();

      gstHeight += 15;
      Object.keys(gstSummary).forEach((rate) => {
        const sum = gstSummary[rate];
        doc
          .text(`${rate}%`, 50, gstHeight)
          .text(`₹${sum.taxable.toFixed(2)}`, 105, gstHeight)
          .text(`${rate / 2}%`, 175, gstHeight)
          .text(`₹${sum.cgst.toFixed(2)}`, 235, gstHeight)
          .text(`${rate / 2}%`, 305, gstHeight)
          .text(`₹${sum.sgst.toFixed(2)}`, 365, gstHeight)
          .font('Helvetica-Bold')
          .text(`₹${sum.totalTax.toFixed(2)}`, 435, gstHeight)
          .font('Helvetica');

        gstHeight += 12;
      });

      // 6. Billing Calculations Summary Card (Right aligned)
      let summaryHeight = currentHeight + 20;
      if (summaryHeight > 620) {
        doc.addPage();
        summaryHeight = 50;
      }
      doc.rect(340, summaryHeight, 205, 120).fill('#f8fafc');

      doc
        .fillColor('#1e293b')
        .fontSize(9)
        .font('Helvetica')
        .text('Subtotal (Taxable):', 355, summaryHeight + 15)
        .text(`₹${(order.subtotal - order.gstTotal).toFixed(2)}`, 480, summaryHeight + 15, {
          align: 'right',
          width: 50
        })

        .text('Total GST Tax:', 355, summaryHeight + 32)
        .text(`₹${order.gstTotal.toFixed(2)}`, 480, summaryHeight + 32, {
          align: 'right',
          width: 50
        })

        .text('Shipping Charge:', 355, summaryHeight + 49)
        .text(
          order.deliveryCharge === 0 ? 'FREE' : `₹${order.deliveryCharge.toFixed(2)}`,
          480,
          summaryHeight + 49,
          { align: 'right', width: 50 }
        )

        .text('Total Discount:', 355, summaryHeight + 66)
        .fillColor('#ef4444')
        .text(
          order.discount > 0 ? `-₹${order.discount.toFixed(2)}` : '₹0.00',
          480,
          summaryHeight + 66,
          { align: 'right', width: 50 }
        )

        .fillColor('#0f766e')
        .font('Helvetica-Bold')
        .fontSize(11)
        .text('Grand Total:', 355, summaryHeight + 88)
        .text(`₹${order.grandTotal.toFixed(2)}`, 470, summaryHeight + 88, {
          align: 'right',
          width: 60
        });

      // 7. Footer
      doc
        .fillColor('#64748b')
        .fontSize(8)
        .font('Helvetica-Oblique')
        .text(
          'Thank you for choosing Pankaj Medical Stores! We appreciate your business.',
          50,
          740,
          { align: 'center' }
        )
        .font('Helvetica')
        .text(
          'This is a computer-generated invoice and does not require a physical signature.',
          50,
          755,
          { align: 'center' }
        );

      doc.end();
    } catch (err) {
      console.error('PDFKit Invoice Generation Exception:', err);
      reject(err);
    }
  });
};
