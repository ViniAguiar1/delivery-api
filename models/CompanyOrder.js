const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Schema para os pedidos de empresa
const companyOrderSchema = new Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pendente', 'aceito', 'em preparo', 'saiu para entrega', 'entregue', 'cancelado'],
    default: 'pendente'
  },
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true
    }
  }],
  motoboyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    default: null
  },
  total: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('CompanyOrder', companyOrderSchema);
