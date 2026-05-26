const Razorpay = require('razorpay');
const crypto = require('crypto');

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;
const isPlaceholder = !keyId || keyId === 'rzp_test_placeholder_key_id';

let razorpay = null;

if (!isPlaceholder) {
  try {
    razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret
    });
    console.log('Razorpay Service: Official SDK client successfully initialized.');
  } catch (err) {
    console.error('Razorpay Service: Failed to initialize official SDK client:', err);
  }
} else {
  console.log('Razorpay Service: Operating in SANDBOX MOCK MODE (using placeholder credentials).');
}

/**
 * Creates a Razorpay Order
 * @param {number} amount - Amount in INR
 * @param {string} receiptId - Internal receipt reference
 * @returns {Promise<object>} Razorpay Order Object
 */
exports.createRazorpayOrder = async (amount, receiptId) => {
  const amountInPaise = Math.round(amount * 100);

  if (isPlaceholder || !razorpay) {
    console.log(`[MOCK RAZORPAY] Generating mock order for ₹${amount} (receipt: ${receiptId})`);
    return {
      id: `mock_order_${crypto.randomBytes(8).toString('hex')}`,
      amount: amountInPaise,
      currency: 'INR',
      receipt: receiptId,
      status: 'created',
      isMock: true
    };
  }

  return await razorpay.orders.create({
    amount: amountInPaise,
    currency: 'INR',
    receipt: receiptId
  });
};

/**
 * Verifies payment signature
 * @param {string} orderId
 * @param {string} paymentId
 * @param {string} signature
 * @returns {boolean} Verified status
 */
exports.verifyPaymentSignature = (orderId, paymentId, signature) => {
  if (isPlaceholder || (orderId && orderId.startsWith('mock_'))) {
    console.log(`[MOCK RAZORPAY] Verifying mock signature for order: ${orderId}`);
    return true;
  }

  if (!orderId || !paymentId || !signature) {
    return false;
  }

  try {
    const text = `${orderId}|${paymentId}`;
    const generatedSignature = crypto.createHmac('sha256', keySecret).update(text).digest('hex');

    const expectedBuffer = Buffer.from(generatedSignature, 'utf-8');
    const actualBuffer = Buffer.from(signature, 'utf-8');

    if (expectedBuffer.length !== actualBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
  } catch (error) {
    console.error('Razorpay Service: Signature verification exception:', error);
    return false;
  }
};

/**
 * Initiates a full or partial refund
 * @param {string} paymentId
 * @param {number} amount - Amount in INR
 * @returns {Promise<object>} Refund response object
 */
exports.initiateRefund = async (paymentId, amount) => {
  const amountInPaise = amount ? Math.round(amount * 100) : undefined;

  if (isPlaceholder || (paymentId && paymentId.startsWith('mock_'))) {
    console.log(`[MOCK RAZORPAY] Initiating mock refund for payment: ${paymentId} of ₹${amount}`);
    return {
      id: `mock_rfnd_${crypto.randomBytes(8).toString('hex')}`,
      payment_id: paymentId,
      amount: amountInPaise,
      status: 'processed',
      isMock: true
    };
  }

  const options = {};
  if (amountInPaise) {
    options.amount = amountInPaise;
  }

  return await razorpay.payments.refund(paymentId, options);
};
