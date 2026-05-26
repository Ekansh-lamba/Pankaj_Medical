const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_FROM_NUMBER || '+15017122661';

const isPlaceholder =
  !accountSid ||
  accountSid.includes('placeholder') ||
  !authToken ||
  authToken.includes('placeholder');

let client = null;

if (!isPlaceholder) {
  try {
    client = twilio(accountSid, authToken);
    console.log('Twilio Service: SMS Client successfully initialized.');
  } catch (err) {
    console.error('Twilio Service: Failed to initialize official Twilio SDK client:', err);
  }
} else {
  console.log('Twilio Service: Operating in SANDBOX CONSOLE MODE (using fallback console logs).');
}

/**
 * Dispatches an SMS alert to a specific recipient
 * @param {string} to - Recipient phone number (e.g., +91XXXXXXXXXX)
 * @param {string} body - Formatted text payload
 * @returns {Promise<object>} Twilio dispatch response or mock status object
 */
exports.sendSMS = async (to, body) => {
  if (isPlaceholder || !client) {
    console.log(
      `\n==========================================\n[SMS DEV CONSOLE FALLBACK]\nTo: ${to}\nMessage: ${body}\n==========================================\n`
    );
    return {
      sid: `mock_sms_${Math.random().toString(36).substring(2, 15)}`,
      status: 'queued',
      isMock: true
    };
  }

  try {
    const message = await client.messages.create({
      body,
      from: fromNumber,
      to
    });
    return message;
  } catch (error) {
    console.error('Twilio SMS sending failed:', error);
    throw error;
  }
};
