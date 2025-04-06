const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Importando o modelo User
const router = express.Router();

const SECRET_KEY = process.env.SECRET_KEY; // Usando variável de ambiente para a chave secreta

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  try {
    console.log('Tentando login para o email:', email); // Log para depuração

    const user = await User.findOne({ email });
    if (!user) {
      console.log('Usuário não encontrado no banco:', email); // Log para depuração
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    console.log('Usuário encontrado:', user); // Log para verificar o usuário retornado
    console.log('Hash armazenado no banco:', user.senha); // Log para verificar o hash
    console.log('Senha fornecida:', senha); // Log para verificar a senha fornecida

    const senhaValida = await bcrypt.compare(senha, user.senha);
    console.log('Resultado da comparação de senha:', senhaValida); // Log para verificar o resultado
    if (!senhaValida) {
      console.log('Senha inválida para o usuário:', email); // Log para depuração
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    const token = jwt.sign(
      { id: user._id, tipo: user.tipo, email: user.email },
      SECRET_KEY,
      { expiresIn: '2h' }
    );

    res.json({
      token,
      usuario: {
        id: user._id,
        nome: user.nome,
        email: user.email,
        tipo: user.tipo
      }
    });
  } catch (error) {
    console.error('Erro ao tentar autenticar:', error.message); // Log para depuração
    res.status(500).json({ error: 'Erro ao tentar autenticar', details: error.message });
  }
});

module.exports = router;
