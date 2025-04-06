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

// POST - adicionar avaliação
router.post('/', autenticarToken, (req, res) => {
  const data = readData();
  const { orderId, companyId, rating, comment } = req.body;

  if (!orderId || !companyId || !rating) {
    return res.status(400).json({ error: 'Campos obrigatórios: orderId, companyId, rating' });
  }

  const pedido = (data.orders || []).find(p => p.id === orderId && p.userId === req.user.id);
  if (!pedido || pedido.status !== 'entregue') {
    return res.status(400).json({ error: 'Avaliação só pode ser feita após entrega.' });
  }

  const jaAvaliado = (data.reviews || []).find(r => r.orderId === orderId);
  if (jaAvaliado) {
    return res.status(400).json({ error: 'Esse pedido já foi avaliado.' });
  }

  const novaReview = {
    id: Date.now().toString(),
    userId: req.user.id,
    companyId,
    orderId,
    rating,
    comment: comment || '',
    createdAt: new Date().toISOString()
  };

  data.reviews.push(novaReview);
  writeData(data);

  res.status(201).json({ message: 'Avaliação registrada com sucesso.', review: novaReview });
});

// GET - listar avaliações públicas de uma empresa
router.get('/company/:companyId', (req, res) => {
  const data = readData();
  const reviews = (data.reviews || []).filter(r => r.companyId == req.params.companyId);
  res.json(reviews);
});

// GET - minhas avaliações
router.get('/my', autenticarToken, (req, res) => {
  const data = readData();
  const minhas = (data.reviews || []).filter(r => r.userId === req.user.id);
  res.json(minhas);
});

// GET - avaliações feitas para a empresa logada
router.get('/my-company', autenticarToken, (req, res) => {
  if (req.user.tipo !== 'empresa') {
    return res.status(403).json({ error: 'Acesso permitido apenas para empresas.' });
  }

  const data = readData();
  const minhasAvaliacoes = (data.reviews || []).filter(r => r.companyId === req.user.id);
  res.json(minhasAvaliacoes);
});

module.exports = router;
