// Cloudinary config skeleton (Full implementation deferred to Phase 3)
const cloudinary = require('cloudinary').v2;

try {
  if (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  ) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });
    console.log('Cloudinary SDK configured successfully.');
  } else {
    console.warn(
      'Cloudinary environment variables not configured yet. Product/Prescription uploads will be unavailable.'
    );
  }
} catch (error) {
  console.error('Cloudinary config error:', error.message);
}

module.exports = cloudinary;
