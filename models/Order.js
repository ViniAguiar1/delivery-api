const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Definindo o Schema do Pedido
const orderSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  companyId: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  addressId: {
    type: Schema.Types.ObjectId,
    ref: 'Address',
    required: true
  },
  items: [
    {
      productId: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true
      },
      name: {
        type: String,
        required: true
      },
      price: {
        type: Number,
        required: true
      },
      quantity: {
        type: Number,
        required: true
      },
      observation: String,
      addOns: [
        {
          name: { type: String, required: true },
          price: { type: Number, required: true, min: 0 }
        }
      ]
    }
  ],
  total: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pendente', 'aceito', 'em preparo', 'saiu para entrega', 'entregue', 'cancelado'],
    default: 'pendente'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  motoboyId: {
    type: Schema.Types.ObjectId,
    ref: 'Staff',
    default: null
  }
});

// Criando o modelo com base no Schema
const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
