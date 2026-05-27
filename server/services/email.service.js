const nodemailer = require('nodemailer');

// Debug environment checks for Nodemailer setup
console.log('EMAIL_USER value:', process.env.EMAIL_USER ? 'SET' : 'MISSING');
console.log('EMAIL_PASS value:', process.env.EMAIL_PASS ? 'SET' : 'MISSING');
console.log('EMAIL_HOST value:', process.env.EMAIL_HOST ? 'SET' : 'MISSING');
console.log('EMAIL_PORT value:', process.env.EMAIL_PORT ? 'SET' : 'MISSING');
console.log('NODE_ENV:', process.env.NODE_ENV);

let transporter;

if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 2525,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  console.log('Nodemailer SMTP Transporter configured successfully.');
} else {
  console.log('SMTP Credentials missing. Nodemailer will run in dev/logging fallback mode.');
  transporter = {
    sendMail: async (mailOptions) => {
      console.log('=============== MOCK EMAIL DISPATCH ===============');
      console.log(`To: ${mailOptions.to}`);
      console.log(`Subject: ${mailOptions.subject}`);
      console.log(`Body (HTML length): ${mailOptions.html.length}`);
      console.log('----------------------------------------------------');
      console.log(mailOptions.html);
      console.log('====================================================');
      return { messageId: 'mock-id-' + Math.random().toString(36).substr(2, 9) };
    }
  };
}



const pharmacyDetails = {
  name: 'PANKAJ MEDICAL AND GENERAL STORES',
  address: '133/17 M Block, Kidwainagar, Kanpur Nagar',
  gstin: '09ACPPL2448G1ZB'
};

/**
 * Send Email Verification OTP/Link
 */
const sendVerificationEmail = async (email, name, token) => {
  const verificationLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email?token=${token}`;

  const mailOptions = {
    from: `"Pankaj Medical Stores" <${process.env.EMAIL_USER || 'no-reply@pankajmedical.com'}>`,
    to: email,
    subject: 'Verify Your Email Address - Pankaj Medical',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 4px; background-color: #ffffff;">
        <div style="background-color: #0d9488; color: #ffffff; padding: 20px; text-align: center; border-radius: 4px 4px 0 0;">
          <h1 style="margin: 0; font-size: 24px; font-weight: bold;">Pankaj Medical & General Stores</h1>
        </div>
        <div style="padding: 20px; color: #333333; line-height: 1.6;">
          <h2 style="color: #0d9488; margin-top: 0;">Welcome, ${name}!</h2>
          <p>Thank you for creating an account with us. To complete your registration and verify your email, please click the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" style="background-color: #0d9488; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Verify Email Address</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666666; font-size: 14px;">${verificationLink}</p>
          <p>This verification link will expire in 24 hours.</p>
        </div>
        <div style="padding: 20px; background-color: #f9f9f9; text-align: center; font-size: 12px; color: #666666; border-top: 1px solid #e0e0e0; border-radius: 0 0 4px 4px;">
          <p style="margin: 0; font-weight: bold;">${pharmacyDetails.name}</p>
          <p style="margin: 4px 0;">${pharmacyDetails.address}</p>
          <p style="margin: 4px 0;">GSTIN: ${pharmacyDetails.gstin}</p>
        </div>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
};

/**
 * Send Password Reset Link
 */
const sendPasswordResetEmail = async (email, name, token) => {
  const resetLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${token}`;

  const mailOptions = {
    from: `"Pankaj Medical Stores" <${process.env.EMAIL_USER || 'no-reply@pankajmedical.com'}>`,
    to: email,
    subject: 'Reset Your Password - Pankaj Medical',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 4px; background-color: #ffffff;">
        <div style="background-color: #0d9488; color: #ffffff; padding: 20px; text-align: center; border-radius: 4px 4px 0 0;">
          <h1 style="margin: 0; font-size: 24px; font-weight: bold;">Pankaj Medical & General Stores</h1>
        </div>
        <div style="padding: 20px; color: #333333; line-height: 1.6;">
          <h2 style="color: #0d9488; margin-top: 0;">Password Reset Request</h2>
          <p>Hello ${name},</p>
          <p>We received a request to reset the password associated with your account. Click the button below to set a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #0d9488; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Reset Password</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666666; font-size: 14px;">${resetLink}</p>
          <p>This password reset request is valid for exactly 1 hour. If you did not make this request, you can safely ignore this email.</p>
        </div>
        <div style="padding: 20px; background-color: #f9f9f9; text-align: center; font-size: 12px; color: #666666; border-top: 1px solid #e0e0e0; border-radius: 0 0 4px 4px;">
          <p style="margin: 0; font-weight: bold;">${pharmacyDetails.name}</p>
          <p style="margin: 4px 0;">${pharmacyDetails.address}</p>
          <p style="margin: 4px 0;">GSTIN: ${pharmacyDetails.gstin}</p>
        </div>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
};

/**
 * Send Welcome Email on Verification Complete
 */
const sendWelcomeEmail = async (email, name) => {
  const mailOptions = {
    from: `"Pankaj Medical Stores" <${process.env.EMAIL_USER || 'no-reply@pankajmedical.com'}>`,
    to: email,
    subject: 'Welcome to Pankaj Medical and General Stores!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 4px; background-color: #ffffff;">
        <div style="background-color: #0d9488; color: #ffffff; padding: 20px; text-align: center; border-radius: 4px 4px 0 0;">
          <h1 style="margin: 0; font-size: 24px; font-weight: bold;">Pankaj Medical & General Stores</h1>
        </div>
        <div style="padding: 20px; color: #333333; line-height: 1.6;">
          <h2 style="color: #0d9488; margin-top: 0;">Your email has been verified!</h2>
          <p>Hello ${name},</p>
          <p>Your email has been successfully verified. Welcome to our online platform! You can now browse our rich catalogue of medicines, upload prescriptions, and place orders smoothly from your mobile or desktop device.</p>
          <p>Please note our pharmacy details below for your future orders and support inquiries.</p>
        </div>
        <div style="padding: 20px; background-color: #f9f9f9; text-align: center; font-size: 12px; color: #666666; border-top: 1px solid #e0e0e0; border-radius: 0 0 4px 4px;">
          <p style="margin: 0; font-weight: bold;">${pharmacyDetails.name}</p>
          <p style="margin: 4px 0;">${pharmacyDetails.address}</p>
          <p style="margin: 4px 0;">GSTIN: ${pharmacyDetails.gstin}</p>
        </div>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
};

/**
 * Send Low Stock Alert Email to Admin
 */
const sendLowStockAlert = async (email, products) => {
  const tableRows = products
    .map(
      (p) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eeeeee; font-weight: bold;">${p.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eeeeee;">${p.brand}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eeeeee; text-align: center; color: #ef4444; font-weight: bold;">${p.stock}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eeeeee; text-align: center;">${p.lowStockThreshold}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eeeeee; text-align: center;">${p.rackLocation || 'Not Assigned'}</td>
    </tr>
  `
    )
    .join('');

  const mailOptions = {
    from: `"Pankaj Medical Stores" <${process.env.EMAIL_USER || 'no-reply@pankajmedical.com'}>`,
    to: email,
    subject: `[Pankaj Medical] Low Stock Alert — ${products.length} Products Need Restocking`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 4px; background-color: #ffffff;">
        <div style="background-color: #0d9488; color: #ffffff; padding: 20px; text-align: center; border-radius: 4px 4px 0 0;">
          <h1 style="margin: 0; font-size: 24px; font-weight: bold;">Pankaj Medical & General Stores</h1>
        </div>
        <div style="padding: 20px; color: #333333; line-height: 1.6;">
          <h2 style="color: #ef4444; margin-top: 0;">Inventory Alert: Low Stock Warning</h2>
          <p>Hello Admin,</p>
          <p>The system inventory check has flagged the following <strong>${products.length}</strong> items as being at or below their low stock threshold levels. Please initiate restock requests with your distributor as soon as possible:</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
            <thead>
              <tr style="background-color: #f2f2f2; text-align: left;">
                <th style="padding: 12px 10px; border-bottom: 2px solid #0d9488;">Medicine Name</th>
                <th style="padding: 12px 10px; border-bottom: 2px solid #0d9488;">Brand</th>
                <th style="padding: 12px 10px; border-bottom: 2px solid #0d9488; text-align: center;">Current Stock</th>
                <th style="padding: 12px 10px; border-bottom: 2px solid #0d9488; text-align: center;">Limit Threshold</th>
                <th style="padding: 12px 10px; border-bottom: 2px solid #0d9488; text-align: center;">Rack Location</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </div>
        <div style="padding: 20px; background-color: #f9f9f9; text-align: center; font-size: 12px; color: #666666; border-top: 1px solid #e0e0e0; border-radius: 0 0 4px 4px;">
          <p style="margin: 0; font-weight: bold;">${pharmacyDetails.name}</p>
          <p style="margin: 4px 0;">${pharmacyDetails.address}</p>
          <p style="margin: 4px 0;">GSTIN: ${pharmacyDetails.gstin}</p>
        </div>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
};

const sendOrderConfirmed = async (email, name, order) => {
  const itemRows = order.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eeeeee;">${item.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eeeeee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eeeeee; text-align: right;">₹${item.sellingPrice.toFixed(2)}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eeeeee; text-align: right; font-weight: bold;">₹${(item.sellingPrice * item.quantity).toFixed(2)}</td>
    </tr>
  `
    )
    .join('');

  const mailOptions = {
    from: `"Pankaj Medical Stores" <${process.env.EMAIL_USER || 'no-reply@pankajmedical.com'}>`,
    to: email,
    subject: `Order Confirmed — ${order.orderNumber} - Pankaj Medical`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 4px; background-color: #ffffff;">
        <div style="background-color: #0d9488; color: #ffffff; padding: 20px; text-align: center; border-radius: 4px 4px 0 0;">
          <h1 style="margin: 0; font-size: 24px; font-weight: bold;">Pankaj Medical & General Stores</h1>
        </div>
        <div style="padding: 20px; color: #333333; line-height: 1.6;">
          <h2 style="color: #0d9488; margin-top: 0;">Your Order is Confirmed!</h2>
          <p>Hello ${name},</p>
          <p>Thank you for shopping with Pankaj Medical. Your order <strong>${order.orderNumber}</strong> has been successfully received and confirmed. Our team is now preparing the medicines for dispatch.</p>
          
          <h3 style="color: #0d9488; border-bottom: 1px solid #0d9488; padding-bottom: 5px; margin-top: 25px;">Order Summary</h3>
          <p><strong>Method:</strong> ${order.payment.method.toUpperCase()} (${order.payment.status.toUpperCase()})<br/>
          <strong>Type:</strong> ${order.deliveryType === 'delivery' ? 'Home Delivery' : 'Store Pickup'}</p>
          
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin: 15px 0;">
            <thead>
              <tr style="background-color: #f2f2f2; text-align: left;">
                <th style="padding: 10px; border-bottom: 2px solid #0d9488;">Item</th>
                <th style="padding: 10px; border-bottom: 2px solid #0d9488; text-align: center;">Qty</th>
                <th style="padding: 10px; border-bottom: 2px solid #0d9488; text-align: right;">Price</th>
                <th style="padding: 10px; border-bottom: 2px solid #0d9488; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows}
            </tbody>
          </table>
          
          <div style="text-align: right; font-size: 14px; line-height: 1.8;">
            <p style="margin: 5px 0;">Subtotal: <strong>₹${order.subtotal.toFixed(2)}</strong></p>
            ${order.discount > 0 ? `<p style="margin: 5px 0; color: #e11d48;">Discount: <strong>-₹${order.discount.toFixed(2)}</strong></p>` : ''}
            <p style="margin: 5px 0;">Shipping Fee: <strong>₹${order.deliveryCharge.toFixed(2)}</strong></p>
            <p style="margin: 5px 0; font-size: 16px; color: #0d9488; font-weight: bold;">Grand Total: <strong>₹${order.grandTotal.toFixed(2)}</strong></p>
          </div>
        </div>
        <div style="padding: 20px; background-color: #f9f9f9; text-align: center; font-size: 12px; color: #666666; border-top: 1px solid #e0e0e0; border-radius: 0 0 4px 4px;">
          <p style="margin: 0; font-weight: bold;">${pharmacyDetails.name}</p>
          <p style="margin: 4px 0;">${pharmacyDetails.address}</p>
          <p style="margin: 4px 0;">GSTIN: ${pharmacyDetails.gstin}</p>
        </div>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
};

const sendOrderShipped = async (email, name, order) => {
  const trackingText =
    order.deliveryType === 'delivery'
      ? '<p>Your order is on the way! It has been packed and handed over to our local delivery executive. You should receive your packages shortly.</p>'
      : '<p>Your order is packed and ready for pickup! You can visit our store located at <strong>133/17 M Block, Kidwainagar, Kanpur Nagar</strong> during open hours to collect your package.</p>';

  const mailOptions = {
    from: `"Pankaj Medical Stores" <${process.env.EMAIL_USER || 'no-reply@pankajmedical.com'}>`,
    to: email,
    subject: `Order Dispatch Update — ${order.orderNumber} - Pankaj Medical`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 4px; background-color: #ffffff;">
        <div style="background-color: #0d9488; color: #ffffff; padding: 20px; text-align: center; border-radius: 4px 4px 0 0;">
          <h1 style="margin: 0; font-size: 24px; font-weight: bold;">Pankaj Medical & General Stores</h1>
        </div>
        <div style="padding: 20px; color: #333333; line-height: 1.6;">
          <h2 style="color: #0d9488; margin-top: 0;">Dispatch Status Update</h2>
          <p>Hello ${name},</p>
          ${trackingText}
          <p><strong>Order Number:</strong> ${order.orderNumber}<br/>
          <strong>Items Count:</strong> ${order.items.length} item(s)<br/>
          <strong>Total Payable:</strong> ₹${order.grandTotal.toFixed(2)}</p>
          
          <p>Please feel free to contact our store line if you have any questions or require immediate support.</p>
        </div>
        <div style="padding: 20px; background-color: #f9f9f9; text-align: center; font-size: 12px; color: #666666; border-top: 1px solid #e0e0e0; border-radius: 0 0 4px 4px;">
          <p style="margin: 0; font-weight: bold;">${pharmacyDetails.name}</p>
          <p style="margin: 4px 0;">${pharmacyDetails.address}</p>
          <p style="margin: 4px 0;">GSTIN: ${pharmacyDetails.gstin}</p>
        </div>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
};

const sendRefundProcessed = async (email, name, order) => {
  const refundAmt = order.payment.refundAmount || order.grandTotal;

  const mailOptions = {
    from: `"Pankaj Medical Stores" <${process.env.EMAIL_USER || 'no-reply@pankajmedical.com'}>`,
    to: email,
    subject: `Refund Processed Successfully — ${order.orderNumber} - Pankaj Medical`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 4px; background-color: #ffffff;">
        <div style="background-color: #e11d48; color: #ffffff; padding: 20px; text-align: center; border-radius: 4px 4px 0 0;">
          <h1 style="margin: 0; font-size: 24px; font-weight: bold;">Pankaj Medical & General Stores</h1>
        </div>
        <div style="padding: 20px; color: #333333; line-height: 1.6;">
          <h2 style="color: #e11d48; margin-top: 0;">Refund Processed</h2>
          <p>Hello ${name},</p>
          <p>This is to confirm that a refund of <strong>₹${refundAmt.toFixed(2)}</strong> has been successfully processed for your order <strong>${order.orderNumber}</strong>. The transaction was credited back to your original mode of payment.</p>
          
          <p><strong>Order Number:</strong> ${order.orderNumber}<br/>
          <strong>Refunded Amount:</strong> ₹${refundAmt.toFixed(2)}<br/>
          <strong>Refund Date:</strong> ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          
          <p>Depending on your banking institution, funds may take 5-7 business days to reflect in your account statement.</p>
        </div>
        <div style="padding: 20px; background-color: #f9f9f9; text-align: center; font-size: 12px; color: #666666; border-top: 1px solid #e0e0e0; border-radius: 0 0 4px 4px;">
          <p style="margin: 0; font-weight: bold;">${pharmacyDetails.name}</p>
          <p style="margin: 4px 0;">${pharmacyDetails.address}</p>
          <p style="margin: 4px 0;">GSTIN: ${pharmacyDetails.gstin}</p>
        </div>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
};

const sendStaffInvite = async (email, name, tempPassword) => {
  const portalUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/login`;

  const mailOptions = {
    from: `"Pankaj Medical Stores" <${process.env.EMAIL_USER || 'no-reply@pankajmedical.com'}>`,
    to: email,
    subject: 'Portal Staff Account Invitation - Pankaj Medical',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 4px; background-color: #ffffff;">
        <div style="background-color: #0d9488; color: #ffffff; padding: 20px; text-align: center; border-radius: 4px 4px 0 0;">
          <h1 style="margin: 0; font-size: 24px; font-weight: bold;">Pankaj Medical & General Stores</h1>
        </div>
        <div style="padding: 20px; color: #333333; line-height: 1.6;">
          <h2 style="color: #0d9488; margin-top: 0;">Staff Invitation</h2>
          <p>Hello ${name},</p>
          <p>An administrator has invited you to register as a staff member on the Pankaj Medical pharmacy management portal. You can log in using your email and the temporary password listed below:</p>
          
          <div style="background-color: #f3f4f6; border-left: 4px solid #0d9488; padding: 15px; margin: 20px 0; font-family: monospace; font-size: 14px;">
            <strong>Email:</strong> ${email}<br/>
            <strong>Temporary Password:</strong> ${tempPassword}
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${portalUrl}" style="background-color: #0d9488; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Access Pharmacy Portal</a>
          </div>
          
          <p style="color: #ef4444; font-weight: bold;">Important Safety Notice: You will be required to change this temporary password immediately upon your first login to secure your account credentials.</p>
        </div>
        <div style="padding: 20px; background-color: #f9f9f9; text-align: center; font-size: 12px; color: #666666; border-top: 1px solid #e0e0e0; border-radius: 0 0 4px 4px;">
          <p style="margin: 0; font-weight: bold;">${pharmacyDetails.name}</p>
          <p style="margin: 4px 0;">${pharmacyDetails.address}</p>
          <p style="margin: 4px 0;">GSTIN: ${pharmacyDetails.gstin}</p>
        </div>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
};

const sendDailySummary = async (email, stats) => {
  const mailOptions = {
    from: `"Pankaj Medical Stores" <${process.env.EMAIL_USER || 'no-reply@pankajmedical.com'}>`,
    to: email,
    subject: `Daily Pharmacy Operations Summary — ${new Date().toLocaleDateString('en-IN')}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 4px; background-color: #ffffff;">
        <div style="background-color: #0d9488; color: #ffffff; padding: 20px; text-align: center; border-radius: 4px 4px 0 0;">
          <h1 style="margin: 0; font-size: 24px; font-weight: bold;">Pankaj Medical & General Stores</h1>
        </div>
        <div style="padding: 20px; color: #333333; line-height: 1.6;">
          <h2 style="color: #0d9488; margin-top: 0;">Daily Operations Executive Summary</h2>
          <p>Hello Admin,</p>
          <p>Here is the automated operations digest for your pharmacy as of <strong>9:00 AM IST</strong> today:</p>
          
          <div style="margin: 25px 0; display: table; width: 100%;">
            <div style="display: table-cell; width: 50%; padding: 15px; background-color: #f3f4f6; border-radius: 8px; text-align: center; border: 1px solid #e5e7eb;">
              <span style="font-size: 11px; text-transform: uppercase; font-weight: bold; color: #6b7280;">Yesterday's Revenue</span>
              <h2 style="margin: 5px 0; color: #0d9488; font-size: 24px;">₹${stats.yesterdayRevenue.toFixed(2)}</h2>
              <span style="font-size: 11px; color: #6b7280;">${stats.orderCount} paid order(s)</span>
            </div>
            <div style="display: table-cell; width: 50%; padding: 15px; background-color: #f3f4f6; border-radius: 8px; text-align: center; border: 1px solid #e5e7eb; border-left: 15px solid transparent;">
              <span style="font-size: 11px; text-transform: uppercase; font-weight: bold; color: #6b7280;">Pending RX Approvals</span>
              <h2 style="margin: 5px 0; color: #b45309; font-size: 24px;">${stats.pendingPrescriptions}</h2>
              <span style="font-size: 11px; color: #6b7280;">Action required</span>
            </div>
          </div>
          
          <div style="padding: 15px; background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; margin-bottom: 20px;">
            <h4 style="margin: 0; color: #ef4444; text-transform: uppercase; font-size: 12px;">Inventory Low-Stock Warning</h4>
            <p style="margin: 5px 0 0 0; font-size: 13px; color: #991b1b;">
              There are currently <strong>${stats.lowStockCount}</strong> item(s) running at or below warning levels in your inventory.
            </p>
          </div>
          
          <p>Please log in to your admin dashboard to review individual order batches, upload responses, and verify pending customer files.</p>
        </div>
        <div style="padding: 20px; background-color: #f9f9f9; text-align: center; font-size: 12px; color: #666666; border-top: 1px solid #e0e0e0; border-radius: 0 0 4px 4px;">
          <p style="margin: 0; font-weight: bold;">${pharmacyDetails.name}</p>
          <p style="margin: 4px 0;">${pharmacyDetails.address}</p>
          <p style="margin: 4px 0;">GSTIN: ${pharmacyDetails.gstin}</p>
        </div>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendLowStockAlert,
  sendOrderConfirmed,
  sendOrderShipped,
  sendRefundProcessed,
  sendStaffInvite,
  sendDailySummary
};
