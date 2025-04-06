const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Importando o modelo User
const router = express.Router();

 
// POST /api/auth/login
router.post('/login', async (req, res) => {
  let { email, senha } = req.body;

  try {
    console.log('Tentando login para o email:', email);

    // Tratamento da senha
    senha = senha.trim();
    senha = senha.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
    senha = senha.replace(/^["']|["']$/g, "");

    console.log('Senha após tratamento:', senha);

    const user = await User.findOne({ email });

    if (!user) {
      console.log('Usuário não encontrado:', email);
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    console.log('Usuário encontrado:', user);
    console.log('Hash armazenado:', user.senha);

    // Comparação de senha
    let senhaValida = await bcrypt.compare(senha, user.senha);
    console.log('Resultado da comparação com senha tratada:', senhaValida);

    if (!senhaValida) {
      senhaValida = await bcrypt.compare(req.body.senha, user.senha);
      console.log('Resultado da comparação com senha original:', senhaValida);
    }

    if (!senhaValida) {
      console.log('Senha inválida para:', email);
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    const token = jwt.sign(
      { id: user._id, tipo: user.tipo, email: user.email },
      process.env.SECRET_KEY,
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
    console.error('Erro na autenticação:', error);
    res.status(500).json({ error: 'Erro ao tentar autenticar' });
  }
});

module.exports = router;
