const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Definindo o esquema para as recomendações de produtos
const recommendationSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',  // Referência ao modelo de usuário
    required: true
  },
  recommendations: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',  // Referência ao modelo de produto
      required: true
    },
    productName: String,
    productPrice: Number,
    productImage: String,
    companyName: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Recommendation', recommendationSchema);
