const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Schema para os favoritos (Favorite)
const favoriteSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',  // Referência ao modelo de usuário
    required: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',  // Referência ao modelo de empresa
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Favorite', favoriteSchema);
