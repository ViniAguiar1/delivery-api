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

// POST - criar pedido
router.post('/', autenticarToken, (req, res) => {
  const data = readData();
  const orders = data.orders || [];

  const { companyId, addressId, items } = req.body;

  if (!companyId || !addressId || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Campos obrigatórios: companyId, addressId, items.' });
  }

  // Verifica se o usuário está bloqueado pela empresa
  const empresa = data.companies.find(c => c.id === companyId);
  if (!empresa) return res.status(404).json({ error: 'Empresa não encontrada' });

  if ((empresa.blockedUsers || []).includes(req.user.id)) {
    return res.status(403).json({ error: 'Você está bloqueado por esta empresa.' });
  }

  const total = items.reduce((acc, item) => {
    const itemTotal = (item.price * item.quantity) + (item.addOns?.reduce((sum, a) => sum + a.price, 0) || 0);
    return acc + itemTotal;
  }, 0);

  const newOrder = {
    id: Date.now().toString(),
    userId: req.user.id,
    companyId,
    addressId,
    items,
    total: parseFloat(total.toFixed(2)),
    status: 'pendente',
    createdAt: new Date().toISOString()
  };

  orders.push(newOrder);
  data.orders = orders;
  writeData(data);

  res.status(201).json(newOrder);
});

// GET - listar pedidos do usuário (histórico)
router.get('/', autenticarToken, (req, res) => {
  const data = readData();
  const orders = (data.orders || []).filter(o => o.userId === req.user.id);
  res.json(orders);
});

// PATCH - cancelar pedido (cliente)
router.patch('/:id/cancel', autenticarToken, (req, res) => {
  const data = readData();
  const orders = data.orders || [];

  const index = orders.findIndex(o => o.id === req.params.id && o.userId === req.user.id);
  if (index === -1) return res.status(404).json({ error: 'Pedido não encontrado.' });

  const pedido = orders[index];

  if (pedido.status !== 'pendente') {
    return res.status(400).json({ error: 'Só é possível cancelar pedidos com status "pendente".' });
  }

  pedido.status = 'cancelado';
  data.orders = orders;
  writeData(data);

  res.json({ message: 'Pedido cancelado com sucesso.', pedido });
});

// GET - detalhes completos de um pedido
router.get('/:id/details', autenticarToken, (req, res) => {
  const data = readData();
  const pedido = (data.orders || []).find(p => p.id === req.params.id);

  if (!pedido) {
    return res.status(404).json({ error: 'Pedido não encontrado.' });
  }

  if (pedido.userId !== req.user.id && req.user.tipo !== 'empresa') {
    return res.status(403).json({ error: 'Você não tem permissão para ver esse pedido.' });
  }

  const empresa = (data.companies || []).find(c => c.id === pedido.companyId);
  const motoboy = pedido.motoboyId
    ? (data.staff || []).find(f => f.id === pedido.motoboyId)
    : null;

  const statusMapa = {
    "pendente": ["pendente"],
    "aceito": ["pendente", "aceito"],
    "em preparo": ["pendente", "aceito", "em preparo"],
    "saiu para entrega": ["pendente", "aceito", "em preparo", "saiu para entrega"],
    "entregue": ["pendente", "aceito", "em preparo", "saiu para entrega", "entregue"],
    "cancelado": ["pendente", "cancelado"]
  };

  const resposta = {
    numeroPedido: pedido.id,
    data: pedido.createdAt,
    statusAtual: pedido.status,
    statusHistorico: statusMapa[pedido.status] || [pedido.status],
    total: pedido.total,
    itens: pedido.items.map(item => ({
      nome: item.name,
      quantidade: item.quantity,
      preco: item.price,
      observacao: item.observation,
      adicionais: item.addOns || []
    })),
    empresa: empresa ? {
      nome: empresa.name,
      imagem: empresa.image
    } : null,
    entregador: motoboy ? {
      nome: motoboy.nome,
      placa: motoboy.placaVeiculo
    } : null
  };

  res.json(resposta);
});

// POST - repetir pedido anterior (adiciona ao carrinho)
router.post('/:id/repeat', autenticarToken, (req, res) => {
  const data = readData();
  const pedido = (data.orders || []).find(p => p.id === req.params.id);

  if (!pedido || pedido.userId !== req.user.id) {
    return res.status(404).json({ error: 'Pedido não encontrado ou não pertence ao usuário.' });
  }

  data.carts = (data.carts || []).filter(c => c.userId !== req.user.id);

  const novoCarrinho = {
    id: Date.now().toString(),
    userId: req.user.id,
    companyId: pedido.companyId,
    items: pedido.items.map(item => ({
      id: Date.now().toString() + Math.random().toString().slice(2, 5),
      productId: item.productId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      observation: item.observation,
      addOns: item.addOns || []
    })),
    createdAt: new Date().toISOString()
  };

  data.carts.push(novoCarrinho);
  writeData(data);

  res.status(201).json({
    message: 'Pedido anterior adicionado ao carrinho com sucesso.',
    carrinho: novoCarrinho
  });
});

// POST - repetir automaticamente o último pedido entregue do usuário
router.post('/repeat-last', autenticarToken, (req, res) => {
  const data = readData();
  const pedidos = (data.orders || []).filter(p => p.userId === req.user.id && p.status === 'entregue');

  if (!pedidos.length) {
    return res.status(404).json({ error: 'Nenhum pedido entregue encontrado para repetir.' });
  }

  const ultimoPedido = pedidos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

  data.carts = (data.carts || []).filter(c => c.userId !== req.user.id);

  const novoCarrinho = {
    id: Date.now().toString(),
    userId: req.user.id,
    companyId: ultimoPedido.companyId,
    items: ultimoPedido.items.map(item => ({
      id: Date.now().toString() + Math.random().toString().slice(2, 5),
      productId: item.productId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      observation: item.observation,
      addOns: item.addOns || []
    })),
    createdAt: new Date().toISOString()
  };

  data.carts.push(novoCarrinho);
  writeData(data);

  res.status(201).json({
    message: 'Último pedido repetido com sucesso.',
    carrinho: novoCarrinho
  });
});

// GET - pedido ativo atual do usuário
router.get('/active', autenticarToken, (req, res) => {
  const data = readData();

  const pedidosAtivos = (data.orders || [])
    .filter(p => p.userId === req.user.id && !['entregue', 'cancelado'].includes(p.status));

  if (!pedidosAtivos.length) {
    return res.status(204).send();
  }

  const pedido = pedidosAtivos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
  const empresa = data.companies.find(c => c.id === pedido.companyId);

  res.json({
    id: pedido.id,
    status: pedido.status,
    createdAt: pedido.createdAt,
    total: pedido.total,
    empresa: empresa ? {
      nome: empresa.name,
      imagem: empresa.image
    } : null,
    itens: pedido.items.map(i => ({
      nome: i.name,
      quantidade: i.quantity
    }))
  });
});

module.exports = router;
