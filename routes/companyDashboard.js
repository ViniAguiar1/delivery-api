const express = require('express');
const fs = require('fs');
const path = require('path');
const autenticarToken = require('../middleware/auth');

const router = express.Router();
const dataPath = path.join(__dirname, '../db/data.json');

function readData() {
  return JSON.parse(fs.readFileSync(dataPath));
}

// Middleware para validar se é empresa
function validarEmpresa(req, res, next) {
  if (req.user.tipo !== 'empresa') {
    return res.status(403).json({ error: 'Acesso permitido apenas para empresas.' });
  }
  next();
}

// GET - total de pedidos da empresa logada
router.get('/orders/total', autenticarToken, validarEmpresa, (req, res) => {
  const data = readData();
  const pedidos = (data.orders || []).filter(p => p.companyId === req.user.id);

  res.json({
    totalPedidos: pedidos.length
  });
});

// GET - contagem de pedidos por status
router.get('/orders/status-count', autenticarToken, validarEmpresa, (req, res) => {
  const data = readData();
  const pedidos = (data.orders || []).filter(p => p.companyId === req.user.id);

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
});

// GET - total de vendas da empresa nos últimos 30 dias
router.get('/total-sales', autenticarToken, validarEmpresa, (req, res) => {
  const data = readData();
  const agora = new Date();
  const trintaDiasAtras = new Date();
  trintaDiasAtras.setDate(agora.getDate() - 30);

  const pedidos = (data.orders || []).filter(p =>
    p.companyId === req.user.id &&
    p.status === 'entregue' &&
    new Date(p.createdAt) >= trintaDiasAtras
  );

  const total = pedidos.reduce((soma, p) => soma + (p.total || 0), 0);

  res.json({
    totalVendas: parseFloat(total.toFixed(2)),
    periodo: "Últimos 30 dias"
  });
});

// GET - média de avaliações da empresa logada
router.get('/ratings', autenticarToken, validarEmpresa, (req, res) => {
  const data = readData();
  const avaliacoes = (data.reviews || []).filter(r => r.companyId === req.user.id);

  const totalAvaliacoes = avaliacoes.length;
  const somaNotas = avaliacoes.reduce((soma, r) => soma + (r.rating || 0), 0);
  const media = totalAvaliacoes > 0 ? somaNotas / totalAvaliacoes : 0;

  res.json({
    media: parseFloat(media.toFixed(2)),
    totalAvaliacoes
  });
});

// GET - produtos mais vendidos da empresa logada
router.get('/top-products', autenticarToken, validarEmpresa, (req, res) => {
  const data = readData();
  const pedidos = (data.orders || []).filter(p =>
    p.companyId === req.user.id && p.status === 'entregue'
  );

  const contagem = {};

  pedidos.forEach(p => {
    (p.items || []).forEach(item => {
      const chave = item.name;
      if (!contagem[chave]) {
        contagem[chave] = 0;
      }
      contagem[chave] += item.quantity || 1;
    });
  });

  const resultado = Object.entries(contagem)
    .map(([name, quantidadeVendida]) => ({ name, quantidadeVendida }))
    .sort((a, b) => b.quantidadeVendida - a.quantidadeVendida);

  res.json(resultado);
});

module.exports = router;
