const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Definindo o Schema de Categoria
const categorySchema = new Schema({
  nome: {
    type: String,
    required: true
  },
  imagem: {
    type: String,
    required: true
  }
});

// Criando o modelo com base no Schema
const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
