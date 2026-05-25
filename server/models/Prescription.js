const mongoose = require('mongoose');

const PrescriptionSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    imageUrl: { type: String, required: true }, // Cloudinary signed URL (private)
    cloudinaryPublicId: { type: String },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'approved', 'rejected', 'reupload_requested'],
      default: 'pending'
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    rejectionReason: { type: String },
    reuploadReason: { type: String },
    validUntil: { type: Date }, // 6 months from upload
    isReusable: { type: Boolean, default: false },
    medicines: [{ type: String }] // Extracted medicine names (manual staff entry)
  },
  { timestamps: true }
);

const Prescription = mongoose.model('Prescription', PrescriptionSchema);
module.exports = Prescription;
