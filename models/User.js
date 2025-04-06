const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');  // Importar bcrypt para hash da senha

const userSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  senha: { type: String, required: true },
  endereco: { type: String, required: true },
  documento: { type: String, required: true },
  celular: { type: String, required: true },
  tipo: {
    type: String,
    enum: ['cliente', 'empresa', 'desenvolvimento'],
    required: true
  },
  codigoConvite: { type: String, unique: true } // Adicionado campo para código de convite
}, {
  timestamps: true
});

// Pré-salvamento: garantir que a senha seja criptografada antes de salvar
userSchema.pre('save', async function(next) {
  if (this.isModified('senha')) {
    console.log('Criptografando senha para o usuário:', this.email); // Log para depuração
    this.senha = await bcrypt.hash(this.senha, 10);  // Criptografa a senha
    console.log('Senha criptografada no cadastro:', this.senha); // Log para verificar o hash gerado
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
