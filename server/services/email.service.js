const nodemailer = require('nodemailer');

// Initialize the Nodemailer Transporter
let transporter;

if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  console.log('Nodemailer SMTP Transporter configured successfully.');
} else {
  console.warn('SMTP Credentials missing. Nodemailer will run in dev/logging fallback mode.');
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

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail
};
