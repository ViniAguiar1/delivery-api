const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Schema para os funcionários (Staff)
const staffSchema = new Schema({
  nome: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  telefone: {
    type: String,
    default: ''
  },
  cargo: {
    type: String,
    enum: ['motoboy', 'cozinheiro', 'garçom', 'gerente'], // Exemplo de cargos
    required: true
  },
  placaVeiculo: {
    type: String,
    default: ''
  },
  empresaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  ativo: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Staff', staffSchema);
