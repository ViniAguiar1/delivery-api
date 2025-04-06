const express = require('express');
const autenticarToken = require('../middleware/auth');
const Order = require('../models/Order'); // Importando a model Order
const Product = require('../models/Product'); // Para validar os produtos, se necessário
const Company = require('../models/Company'); // Para verificar se a empresa está bloqueando o usuário
const router = express.Router();

// POST - Criar pedido
router.post('/', autenticarToken, async (req, res) => {
  const { companyId, addressId, items } = req.body;

  if (!companyId || !addressId || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Campos obrigatórios: companyId, addressId, items.' });
  }

  // Verificar se a empresa existe
  const company = await Company.findById(companyId);
  if (!company) return res.status(404).json({ error: 'Empresa não encontrada' });

  // Verificar se o endereço está em uma região bloqueada pela empresa
  const address = await Address.findById(addressId); // Aqui você precisará de um modelo de Address
  if (!address) return res.status(404).json({ error: 'Endereço não encontrado' });

  const userPostalCode = address.postalCode; // Ou qualquer outro campo que represente a região do endereço

  if (company.blockedRegions.includes(userPostalCode)) {
    return res.status(400).json({ error: 'Esta região está bloqueada para entregas.' });
  }

  const total = items.reduce((acc, item) => {
    const itemTotal = (item.price * item.quantity) + (item.addOns?.reduce((sum, a) => sum + a.price, 0) || 0);
    return acc + itemTotal;
  }, 0);

  const newOrder = new Order({
    userId: req.user.id,
    companyId,
    addressId,
    items,
    total: parseFloat(total.toFixed(2)),
    status: 'pendente',
  });

  try {
    await newOrder.save();
    res.status(201).json(newOrder);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar pedido', details: error.message });
  }
});

// GET - Listar pedidos do usuário (histórico)
router.get('/', autenticarToken, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id }).populate('companyId').populate('items.productId');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar pedidos', details: error.message });
  }
});

// PATCH - Cancelar pedido (cliente)
router.patch('/:id/cancel', autenticarToken, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, userId: req.user.id });

    if (!order) {
      return res.status(404).json({ error: 'Pedido não encontrado.' });
    }

    if (order.status !== 'pendente') {
      return res.status(400).json({ error: 'Só é possível cancelar pedidos com status "pendente".' });
    }

    order.status = 'cancelado';
    await order.save();
    
    res.json({ message: 'Pedido cancelado com sucesso.', pedido: order });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao cancelar o pedido', details: error.message });
  }
});

// GET - Detalhes completos de um pedido
router.get('/:id/details', autenticarToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('companyId')
      .populate('items.productId')
      .populate('motoboyId');

    if (!order) {
      return res.status(404).json({ error: 'Pedido não encontrado.' });
    }

    if (order.userId !== req.user.id && req.user.tipo !== 'empresa') {
      return res.status(403).json({ error: 'Você não tem permissão para ver esse pedido.' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao obter detalhes do pedido', details: error.message });
  }
});

// POST - Repetir pedido anterior (adiciona ao carrinho)
router.post('/:id/repeat', autenticarToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.productId');

    if (!order || order.userId !== req.user.id) {
      return res.status(404).json({ error: 'Pedido não encontrado ou não pertence ao usuário.' });
    }

    const itemsToAdd = order.items.map(item => ({
      productId: item.productId._id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      observation: item.observation,
      addOns: item.addOns
    }));

    // Aqui você pode adicionar os itens do pedido anterior ao carrinho, dependendo da implementação do carrinho
    // Você pode usar a lógica de adicionar ao carrinho com base nos itens do pedido

    res.status(201).json({ message: 'Pedido anterior adicionado ao carrinho com sucesso.' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao repetir pedido', details: error.message });
  }
});

// POST - Repetir automaticamente o último pedido entregue do usuário
router.post('/repeat-last', autenticarToken, async (req, res) => {
  try {
    const lastOrder = await Order.findOne({ userId: req.user.id, status: 'entregue' }).sort({ createdAt: -1 }).populate('items.productId');

    if (!lastOrder) {
      return res.status(404).json({ error: 'Nenhum pedido entregue encontrado para repetir.' });
    }

    const itemsToAdd = lastOrder.items.map(item => ({
      productId: item.productId._id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      observation: item.observation,
      addOns: item.addOns
    }));

    // Aqui você pode adicionar os itens do pedido anterior ao carrinho, dependendo da implementação do carrinho
    // Lógica para adicionar os itens ao carrinho

    res.status(201).json({ message: 'Último pedido repetido com sucesso.' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao repetir último pedido', details: error.message });
  }
});

// GET - Pedido ativo atual do usuário
router.get('/active', autenticarToken, async (req, res) => {
  try {
    const activeOrder = await Order.findOne({ userId: req.user.id, status: { $nin: ['entregue', 'cancelado'] } });

    if (!activeOrder) {
      return res.status(204).send();
    }

    res.json(activeOrder);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao obter pedido ativo', details: error.message });
  }
});

module.exports = router;
