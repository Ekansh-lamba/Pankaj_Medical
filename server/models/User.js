const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const AddressSchema = new mongoose.Schema({
  label: { type: String, required: true }, // Home, Office, etc.
  line1: { type: String, required: true },
  line2: { type: String },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pinCode: { type: String, required: true },
  isDefault: { type: Boolean, default: false }
});

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      unique: true,
      sparse: true,
      trim: true
    },
    passwordHash: { type: String },
    firebaseUid: { type: String, unique: true, sparse: true },
    authProviders: {
      type: [String],
      enum: ['email', 'google', 'phone'],
      default: ['email']
    },
    role: {
      type: String,
      enum: ['customer', 'staff', 'admin'],
      default: 'customer'
    },
    permissions: {
      manageOrders: { type: Boolean, default: false },
      verifyPrescriptions: { type: Boolean, default: false },
      manageInventory: { type: Boolean, default: false },
      viewReports: { type: Boolean, default: false },
      manageProducts: { type: Boolean, default: false }
    },
    addresses: [AddressSchema],
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    notificationPreferences: {
      promotional: { type: Boolean, default: true },
      sms: { type: Boolean, default: true }
    },
    emailVerificationToken: { type: String },
    emailVerificationExpires: { type: Date },
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date }
  },
  { timestamps: true }
);

// Hash password with exactly 12 salt rounds before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash') || !this.passwordHash) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function (enteredPassword) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(enteredPassword, this.passwordHash);
};

// Instance method to soft-delete and anonymize user PII
UserSchema.methods.anonymize = async function () {
  this.isDeleted = true;
  this.isActive = false;
  this.name = 'Anonymized Customer';
  this.email = `deleted_user_${this._id}@pankajmedical.com`;
  this.phone = undefined; // Sparse indexes require undefined for missing unique fields rather than empty strings
  this.addresses = [];
  this.firebaseUid = undefined;
  this.passwordHash = undefined;
  this.emailVerificationToken = undefined;
  this.emailVerificationExpires = undefined;
  this.passwordResetToken = undefined;
  this.passwordResetExpires = undefined;

  return this.save();
};

const User = mongoose.model('User', UserSchema);
module.exports = User;
