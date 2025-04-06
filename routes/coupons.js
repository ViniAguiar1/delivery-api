const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const dataPath = path.join(__dirname, '../db/data.json');

function readData() {
  const raw = fs.readFileSync(dataPath);
  return JSON.parse(raw);
}

function writeData(data) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

// GET - Listar cupons do sistema
router.get('/', (req, res) => {
  const data = readData();
  res.json(data.coupons || []);
});

// POST - Criar novo cupom
router.post('/', (req, res) => {
  const data = readData();
  const coupons = data.coupons || [];

  const { code, discount, description, minValue, isActive } = req.body;

  if (!code || !discount || !description || minValue == null || isActive == null) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
  }

  const alreadyExists = coupons.find(c => c.code === code);
  if (alreadyExists) {
    return res.status(409).json({ error: 'Cupom já existe com esse código.' });
  }

  const newCoupon = {
    id: Date.now().toString(),
    code,
    discount,
    description,
    minValue,
    isActive
  };

  coupons.push(newCoupon);
  data.coupons = coupons;
  writeData(data);

  res.status(201).json(newCoupon);
});

// PATCH - Atualizar cupom
router.patch('/:id', (req, res) => {
  const data = readData();
  const coupons = data.coupons || [];

  const index = coupons.findIndex(c => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Cupom não encontrado.' });
  }

  coupons[index] = { ...coupons[index], ...req.body };
  data.coupons = coupons;
  writeData(data);

  res.json(coupons[index]);
});

// DELETE - Remover cupom
router.delete('/:id', (req, res) => {
  const data = readData();
  const coupons = data.coupons || [];

  const index = coupons.findIndex(c => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Cupom não encontrado.' });
  }

  const removed = coupons.splice(index, 1);
  data.coupons = coupons;
  writeData(data);

  res.json({ message: 'Cupom removido com sucesso.', cupom: removed[0] });
});

module.exports = router;
