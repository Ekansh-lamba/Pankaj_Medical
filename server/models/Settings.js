const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema(
  {
    deliveryCharge: { type: Number, default: 50 },
    freeDeliveryThreshold: { type: Number, default: 500 },
    minimumOrderValue: { type: Number, default: 200 },
    serviceablePinCodes: [{ type: String }],
    workingHours: {
      open: { type: String, default: '09:00' },
      close: { type: String, default: '22:00' }
    },
    estimatedDeliveryHours: { type: Number, default: 24 },
    pharmacyPhone: { type: String },
    pharmacyEmail: { type: String },
    maintenanceMode: { type: Boolean, default: false },
    autoOffers: [
      {
        isActive: { type: Boolean, default: true },
        title: { type: String, required: true },
        minOrderValue: { type: Number, default: 0 },
        discountType: { type: String, enum: ['flat', 'percentage'], default: 'percentage' },
        discountValue: { type: Number, required: true },
        maxDiscount: { type: Number }
      }
    ]
  },
  { timestamps: true }
);

const Settings = mongoose.model('Settings', SettingsSchema);
module.exports = Settings;
