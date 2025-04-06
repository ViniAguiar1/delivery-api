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

// GET - listar cartões do usuário
router.get('/', autenticarToken, (req, res) => {
  const data = readData();
  const cards = (data.paymentMethods || []).filter(c => c.userId === req.user.id);
  res.json(cards);
});

// POST - cadastrar novo cartão
router.post('/', autenticarToken, (req, res) => {
  const data = readData();
  const cards = data.paymentMethods || [];

  const { nomeTitular, numeroCartao, validade, cvv, tipo } = req.body;

  if (!nomeTitular || !numeroCartao || !validade || !cvv || !tipo) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
  }

  const tiposPermitidos = ['crédito', 'débito'];
  if (!tiposPermitidos.includes(tipo)) {
    return res.status(400).json({ error: 'Tipo de cartão inválido. Use "crédito" ou "débito".' });
  }

  const ultimos4 = numeroCartao.slice(-4);
  const novoCartao = {
    id: Date.now().toString(),
    userId: req.user.id,
    nomeTitular,
    numeroCartao: `**** **** **** ${ultimos4}`,
    validade,
    cvv: "***",
    tipo
  };

  cards.push(novoCartao);
  data.paymentMethods = cards;
  writeData(data);

  res.status(201).json(novoCartao);
});

// PATCH - atualizar cartão
router.patch('/:id', autenticarToken, (req, res) => {
  const data = readData();
  const cards = data.paymentMethods || [];

  const index = cards.findIndex(c => c.id === req.params.id && c.userId === req.user.id);
  if (index === -1) return res.status(404).json({ error: 'Cartão não encontrado.' });

  const atual = cards[index];
  const atualizacao = req.body;

  // Atualizar número: exibir apenas final
  if (atualizacao.numeroCartao) {
    atualizacao.numeroCartao = `**** **** **** ${atualizacao.numeroCartao.slice(-4)}`;
  }

  cards[index] = { ...atual, ...atualizacao };
  data.paymentMethods = cards;
  writeData(data);

  res.json(cards[index]);
});

// DELETE - excluir cartão
router.delete('/:id', autenticarToken, (req, res) => {
  const data = readData();
  const cards = data.paymentMethods || [];

  const index = cards.findIndex(c => c.id === req.params.id && c.userId === req.user.id);
  if (index === -1) return res.status(404).json({ error: 'Cartão não encontrado.' });

  const removed = cards.splice(index, 1);
  data.paymentMethods = cards;
  writeData(data);

  res.json({ message: 'Cartão removido com sucesso.', cartao: removed[0] });
});

module.exports = router;
