const express = require('express');
const fs = require('fs');
const path = require('path');
const autenticarToken = require('../middleware/auth');

const router = express.Router();
const dataPath = path.join(__dirname, '../db/data.json');

function readData() {
  return JSON.parse(fs.readFileSync(dataPath));
}

function writeData(data) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

// Middleware de validação do tipo empresa
function validarEmpresa(req, res, next) {
  if (req.user.tipo !== 'empresa') {
    return res.status(403).json({ error: 'Acesso permitido apenas para empresas.' });
  }
  next();
}

// PATCH /api/companies/block-user
router.patch('/block-user', autenticarToken, validarEmpresa, (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId é obrigatório' });

  const data = readData();
  const empresa = data.companies.find(c => c.id === req.user.id);

  if (!empresa) return res.status(404).json({ error: 'Empresa não encontrada' });

  empresa.blockedUsers = empresa.blockedUsers || [];

  if (!empresa.blockedUsers.includes(userId)) {
    empresa.blockedUsers.push(userId);
    writeData(data);
  }

  res.json({ message: 'Usuário bloqueado com sucesso.', blockedUsers: empresa.blockedUsers });
});

// PATCH /api/companies/unblock-user
router.patch('/unblock-user', autenticarToken, validarEmpresa, (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId é obrigatório' });

  const data = readData();
  const empresa = data.companies.find(c => c.id === req.user.id);

  if (!empresa) return res.status(404).json({ error: 'Empresa não encontrada' });

  empresa.blockedUsers = empresa.blockedUsers || [];
  empresa.blockedUsers = empresa.blockedUsers.filter(id => id !== userId);

  writeData(data);

  res.json({ message: 'Usuário desbloqueado com sucesso.', blockedUsers: empresa.blockedUsers });
});

module.exports = router;
