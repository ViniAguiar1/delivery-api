const express = require('express');
const router = express.Router();
const Coupon = require('../models/Coupon');

// GET - Listar cupons do sistema
router.get('/', async (req, res) => {
  try {
    const cupons = await Coupon.find();
    res.json(cupons);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar cupons.' });
  }
});

// POST - Criar novo cupom
router.post('/', async (req, res) => {
  try {
    const { code, discount, description, minValue, isActive } = req.body;

    if (!code || !discount || !description || minValue == null || isActive == null) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }

    const existe = await Coupon.findOne({ code });
    if (existe) {
      return res.status(409).json({ error: 'Cupom já existe com esse código.' });
    }

    const novo = new Coupon({ code, discount, description, minValue, isActive });
    await novo.save();

    res.status(201).json(novo);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar cupom.' });
  }
});

// PATCH - Atualizar cupom
router.patch('/:id', async (req, res) => {
  try {
    const atualizado = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!atualizado) {
      return res.status(404).json({ error: 'Cupom não encontrado.' });
    }
    res.json(atualizado);
  } catch {
    res.status(400).json({ error: 'ID inválido ou erro ao atualizar cupom.' });
  }
});

// DELETE - Remover cupom
router.delete('/:id', async (req, res) => {
  try {
    const removido = await Coupon.findByIdAndDelete(req.params.id);
    if (!removido) {
      return res.status(404).json({ error: 'Cupom não encontrado.' });
    }
    res.json({ message: 'Cupom removido com sucesso.', cupom: removido });
  } catch {
    res.status(400).json({ error: 'Erro ao deletar cupom.' });
  }
});

module.exports = router;
