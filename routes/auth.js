const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

const dataPath = path.join(__dirname, '../db/data.json');
const SECRET_KEY = 'sua-chave-secreta-super-segura'; // idealmente isso vai pro .env

function readData() {
  const raw = fs.readFileSync(dataPath);
  return JSON.parse(raw);
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  const data = readData();
  const user = (data.users || []).find(u => u.email === email);

  if (!user) {
    return res.status(401).json({ error: 'Email ou senha inválidos' });
  }

  const senhaValida = await bcrypt.compare(senha, user.senha);
  if (!senhaValida) {
    return res.status(401).json({ error: 'Email ou senha inválidos' });
  }

  const token = jwt.sign(
    { id: user.id, tipo: user.tipo, email: user.email },
    SECRET_KEY,
    { expiresIn: '2h' }
  );

  res.json({
    token,
    usuario: {
      id: user.id,
      nome: user.nome,
      email: user.email,
      tipo: user.tipo
    }
  });
});

module.exports = router;
