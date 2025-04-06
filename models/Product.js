const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: false // Caso seja opcional
  },
  price: {
    type: Number,
    required: true
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  stock: {
    type: Number,
    required: true,
    default: 0 // Definindo um valor padrão caso o campo não seja informado
  },
  imageUrl: {
    type: String,
    required: false // Isso é opcional, mas você pode torná-lo obrigatório se for um requisito
  }
}, {
  timestamps: true // Para adicionar campos de createdAt e updatedAt automaticamente
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
