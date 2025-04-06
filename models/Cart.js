const mongoose = require('mongoose');

const AddOnSchema = new mongoose.Schema({
  name: String,
  price: Number
}, { _id: false });

const CartItemSchema = new mongoose.Schema({
  id: String,
  productId: Number,
  name: String,
  price: Number,
  quantity: Number,
  observation: String,
  addOns: [AddOnSchema]
}, { _id: false });

const CartSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  companyId: {
    type: Number,
    required: true
  },
  items: [CartItemSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Cart', CartSchema);
