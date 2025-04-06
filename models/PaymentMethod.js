const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Definindo o Schema do Cartão de Pagamento
const paymentMethodSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  nomeTitular: {
    type: String,
    required: true
  },
  numeroCartao: {
    type: String,
    required: true
  },
  validade: {
    type: String,
    required: true
  },
  cvv: {
    type: String,
    required: true
  },
  tipo: {
    type: String,
    enum: ['crédito', 'débito'],
    required: true
  }
});

// Criando o modelo com base no Schema
const PaymentMethod = mongoose.model('PaymentMethod', paymentMethodSchema);

module.exports = PaymentMethod;
