const mongoose = require('mongoose');

const AddressSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  apelido: {
    type: String,
    required: true
  },
  rua: String,
  numero: String,
  bairro: String,
  cidade: String,
  estado: String,
  cep: String,
  complemento: String,
  isDefault: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Address', AddressSchema);
