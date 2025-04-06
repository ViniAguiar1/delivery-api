const express = require('express');
const Review = require('../models/Review'); // Importando a model Review
const Order = require('../models/Order'); // Importando a model Order
const autenticarToken = require('../middleware/auth');

const router = express.Router();

// POST - adicionar avaliação
router.post('/', autenticarToken, async (req, res) => {
  const { orderId, companyId, rating, comment } = req.body;

  if (!orderId || !companyId || !rating) {
    return res.status(400).json({ error: 'Campos obrigatórios: orderId, companyId, rating' });
  }

  try {
    // Verifica se o pedido foi feito pelo usuário e se o status do pedido é 'entregue'
    const pedido = await Order.findOne({ _id: orderId, userId: req.user.id });

    if (!pedido || pedido.status !== 'entregue') {
      return res.status(400).json({ error: 'Avaliação só pode ser feita após entrega.' });
    }

    // Verifica se o pedido já foi avaliado
    const jaAvaliado = await Review.findOne({ orderId });
    if (jaAvaliado) {
      return res.status(400).json({ error: 'Esse pedido já foi avaliado.' });
    }

    // Cria uma nova avaliação
    const novaReview = new Review({
      userId: req.user.id,
      companyId,
      orderId,
      rating,
      comment: comment || '',
    });

    // Salva a avaliação no banco de dados
    await novaReview.save();

    res.status(201).json({ message: 'Avaliação registrada com sucesso.', review: novaReview });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao registrar avaliação.' });
  }
});

// GET - listar avaliações públicas de uma empresa
router.get('/company/:companyId', async (req, res) => {
  try {
    const reviews = await Review.find({ companyId: req.params.companyId });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar avaliações.' });
  }
});

// GET - minhas avaliações
router.get('/my', autenticarToken, async (req, res) => {
  try {
    const minhas = await Review.find({ userId: req.user.id });
    res.json(minhas);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar suas avaliações.' });
  }
});

// GET - avaliações feitas para a empresa logada
router.get('/my-company', autenticarToken, async (req, res) => {
  if (req.user.tipo !== 'empresa') {
    return res.status(403).json({ error: 'Acesso permitido apenas para empresas.' });
  }

  try {
    const minhasAvaliacoes = await Review.find({ companyId: req.user.id });
    res.json(minhasAvaliacoes);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar avaliações feitas para sua empresa.' });
  }
});

module.exports = router;
