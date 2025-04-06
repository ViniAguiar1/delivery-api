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

// Middleware para validar empresa
function validarEmpresa(req, res, next) {
  if (req.user.tipo !== 'empresa') {
    return res.status(403).json({ error: 'Acesso permitido apenas para empresas.' });
  }
  next();
}

// GET /stock - listar produtos com estoque da empresa logada
router.get('/', autenticarToken, validarEmpresa, (req, res) => {
  const data = readData();
  const produtos = (data.products || []).filter(p => p.companyId === req.user.id);

  const estoque = produtos.map(p => ({
    id: p.id,
    nome: p.name,
    estoque: typeof p.estoque === 'number' ? p.estoque : null
  }));

  res.json(estoque);
});

// PATCH /stock/:productId - atualizar estoque de um produto da empresa
router.patch('/:productId', autenticarToken, validarEmpresa, (req, res) => {
  const { productId } = req.params;
  const { estoque } = req.body;

  if (typeof estoque !== 'number' || estoque < 0) {
    return res.status(400).json({ error: 'Estoque deve ser um número igual ou maior que 0.' });
  }

  const data = readData();
  const produtos = data.products || [];
  const produto = produtos.find(p => p.id == productId && p.companyId === req.user.id);

  if (!produto) return res.status(404).json({ error: 'Produto não encontrado para esta empresa.' });

  produto.estoque = estoque;

  data.products = produtos;
  writeData(data);

  res.json({ message: 'Estoque atualizado com sucesso.', produto });
});

// DELETE /stock/:productId - remover produto da empresa logada
router.delete('/:productId', autenticarToken, validarEmpresa, (req, res) => {
  const { productId } = req.params;
  const data = readData();
  let produtos = data.products || [];

  const index = produtos.findIndex(p => p.id == productId && p.companyId === req.user.id);
  if (index === -1) return res.status(404).json({ error: 'Produto não encontrado para esta empresa.' });

  const removido = produtos.splice(index, 1)[0];
  data.products = produtos;
  writeData(data);

  res.json({ message: 'Produto removido do estoque com sucesso.', produto: removido });
});

module.exports = router;
