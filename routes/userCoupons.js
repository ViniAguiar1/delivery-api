const express = require('express');
const fs = require('fs');
const path = require('path');
const autenticarToken = require('../middleware/auth');

const router = express.Router();
const dataPath = path.join(__dirname, '../db/data.json');

function readData() {
  const raw = fs.readFileSync(dataPath);
  return JSON.parse(raw);
}

function writeData(data) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

// GET - listar cupons do usuário
router.get('/', autenticarToken, (req, res) => {
  const data = readData();
  const userCoupons = (data.userCoupons || []).filter(c => c.userId === req.user.id);
  res.json(userCoupons);
});

// POST - adicionar cupom do sistema ao usuário
router.post('/:couponId', autenticarToken, (req, res) => {
  const data = readData();
  const coupons = data.coupons || [];
  const userCoupons = data.userCoupons || [];

  const couponId = req.params.couponId;
  const baseCoupon = coupons.find(c => c.id === couponId);

  if (!baseCoupon) {
    return res.status(404).json({ error: 'Cupom do sistema não encontrado.' });
  }

  const alreadyAdded = userCoupons.find(
    c => c.userId === req.user.id && c.code === baseCoupon.code
  );

  if (alreadyAdded) {
    return res.status(409).json({ error: 'Esse cupom já está vinculado ao seu perfil.' });
  }

  const newUserCoupon = {
    id: Date.now().toString(),
    userId: req.user.id,
    code: baseCoupon.code,
    discount: baseCoupon.discount,
    description: baseCoupon.description,
    minValue: baseCoupon.minValue,
    isActive: baseCoupon.isActive,
    validUntil: req.body.validUntil || null,
    price: req.body.price || 0,
    usesLeft: req.body.usesLeft || 1,
    maxUses: req.body.maxUses || 1,
    purchased: req.body.purchased || false
  };

  userCoupons.push(newUserCoupon);
  data.userCoupons = userCoupons;
  writeData(data);

  res.status(201).json(newUserCoupon);
});

// PATCH - atualizar cupom do usuário
router.patch('/:id', autenticarToken, (req, res) => {
  const data = readData();
  const userCoupons = data.userCoupons || [];

  const index = userCoupons.findIndex(c => c.id === req.params.id && c.userId === req.user.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Cupom do usuário não encontrado.' });
  }

  userCoupons[index] = { ...userCoupons[index], ...req.body };
  data.userCoupons = userCoupons;
  writeData(data);

  res.json(userCoupons[index]);
});

// DELETE - remover cupom do usuário
router.delete('/:id', autenticarToken, (req, res) => {
  const data = readData();
  const userCoupons = data.userCoupons || [];

  const index = userCoupons.findIndex(c => c.id === req.params.id && c.userId === req.user.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Cupom do usuário não encontrado.' });
  }

  const removed = userCoupons.splice(index, 1);
  data.userCoupons = userCoupons;
  writeData(data);

  res.json({ message: 'Cupom removido com sucesso', cupom: removed[0] });
});

module.exports = router;
