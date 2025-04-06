const express = require('express');
const autenticarToken = require('../middleware/auth');
const router = express.Router();

const UserCoupon = require('../models/UserCoupon');
const Coupon = require('../models/Coupon'); // para pegar cupons do sistema

// GET - listar cupons do usuário logado
router.get('/', autenticarToken, async (req, res) => {
  try {
    const cupons = await UserCoupon.find({ userId: req.user.id });
    res.json(cupons);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar cupons.' });
  }
});

// POST - adicionar cupom do sistema ao usuário
router.post('/:couponId', autenticarToken, async (req, res) => {
  try {
    const base = await Coupon.findById(req.params.couponId);
    if (!base) return res.status(404).json({ error: 'Cupom do sistema não encontrado.' });

    const existe = await UserCoupon.findOne({ userId: req.user.id, code: base.code });
    if (existe) return res.status(409).json({ error: 'Esse cupom já está vinculado ao seu perfil.' });

    const novo = new UserCoupon({
      userId: req.user.id,
      code: base.code,
      discount: base.discount,
      description: base.description,
      validUntil: req.body.validUntil || null,
      minValue: base.minValue,
      isActive: base.isActive,
      price: req.body.price || 0,
      usesLeft: req.body.usesLeft || 1,
      maxUses: req.body.maxUses || 1,
      purchased: req.body.purchased || false
    });

    await novo.save();
    res.status(201).json(novo);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao adicionar cupom.' });
  }
});

// PATCH - atualizar dados do cupom do usuário
router.patch('/:id', autenticarToken, async (req, res) => {
  try {
    const atualizado = await UserCoupon.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true }
    );
    if (!atualizado) return res.status(404).json({ error: 'Cupom não encontrado.' });
    res.json(atualizado);
  } catch {
    res.status(400).json({ error: 'ID inválido ou erro ao atualizar.' });
  }
});

// DELETE - remover cupom do usuário
router.delete('/:id', autenticarToken, async (req, res) => {
  try {
    const removido = await UserCoupon.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!removido) return res.status(404).json({ error: 'Cupom não encontrado.' });
    res.json({ message: 'Cupom removido com sucesso', cupom: removido });
  } catch {
    res.status(400).json({ error: 'Erro ao deletar cupom.' });
  }
});

module.exports = router;
