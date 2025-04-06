const mongoose = require('mongoose');

const userCouponSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  code: { type: String, required: true },
  discount: { type: String, required: true },
  description: { type: String },
  validUntil: { type: String },
  minValue: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  price: { type: Number, default: 0 },
  usesLeft: { type: Number, default: 1 },
  maxUses: { type: Number, default: 1 },
  purchased: { type: Boolean, default: false }
}, {
  timestamps: true
});

module.exports = mongoose.model('UserCoupon', userCouponSchema);
