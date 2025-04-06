const express = require('express');
const Order = require('../models/Order');  // Modelo para Orders
const Review = require('../models/Review');  // Modelo para Reviews
const Product = require('../models/Product');  // Modelo para Products
const autenticarToken = require('../middleware/auth');

const router = express.Router();

// Middleware para validar se é empresa
function validarEmpresa(req, res, next) {
  if (req.user.tipo !== 'empresa') {
    return res.status(403).json({ error: 'Acesso permitido apenas para empresas.' });
  }
  next();
}

// GET - total de pedidos da empresa logada
router.get('/orders/total', autenticarToken, validarEmpresa, async (req, res) => {
  try {
    const totalPedidos = await Order.countDocuments({ companyId: req.user.id });
    res.json({
      totalPedidos
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar total de pedidos.' });
  }
});

// GET - contagem de pedidos por status
router.get('/orders/status-count', autenticarToken, validarEmpresa, async (req, res) => {
  try {
    const pedidos = await Order.find({ companyId: req.user.id });

    const statusContagem = {
      pendente: 0,
      aceito: 0,
      "em preparo": 0,
      "saiu para entrega": 0,
      entregue: 0,
      cancelado: 0
    };

    pedidos.forEach(p => {
      if (statusContagem[p.status] !== undefined) {
        statusContagem[p.status]++;
      }
    });

    res.json(statusContagem);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao contar os pedidos por status.' });
  }
});

// GET - total de vendas da empresa nos últimos 30 dias
router.get('/total-sales', autenticarToken, validarEmpresa, async (req, res) => {
  try {
    const agora = new Date();
    const trintaDiasAtras = new Date();
    trintaDiasAtras.setDate(agora.getDate() - 30);

    const pedidos = await Order.find({
      companyId: req.user.id,
      status: 'entregue',
      createdAt: { $gte: trintaDiasAtras }
    });

    const total = pedidos.reduce((soma, p) => soma + p.total, 0);

    res.json({
      totalVendas: parseFloat(total.toFixed(2)),
      periodo: "Últimos 30 dias"
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao calcular as vendas.' });
  }
});

// GET - média de avaliações da empresa logada
router.get('/ratings', autenticarToken, validarEmpresa, async (req, res) => {
  try {
    const avaliacoes = await Review.find({ companyId: req.user.id });

    const totalAvaliacoes = avaliacoes.length;
    const somaNotas = avaliacoes.reduce((soma, r) => soma + r.rating, 0);
    const media = totalAvaliacoes > 0 ? somaNotas / totalAvaliacoes : 0;

    res.json({
      media: parseFloat(media.toFixed(2)),
      totalAvaliacoes
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao calcular a média das avaliações.' });
  }
});

// GET - produtos mais vendidos da empresa logada
router.get('/top-products', autenticarToken, validarEmpresa, async (req, res) => {
  try {
    const pedidos = await Order.find({
      companyId: req.user.id,
      status: 'entregue'
    });

    const contagem = {};

    pedidos.forEach(p => {
      (p.items || []).forEach(item => {
        const chave = item.name;
        if (!contagem[chave]) {
          contagem[chave] = 0;
        }
        contagem[chave] += item.quantity;
      });
    });

    const resultado = Object.entries(contagem)
      .map(([name, quantidadeVendida]) => ({ name, quantidadeVendida }))
      .sort((a, b) => b.quantidadeVendida - a.quantidadeVendida);

    res.json(resultado);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao calcular produtos mais vendidos.' });
  }
});

module.exports = router;
