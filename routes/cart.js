const express = require('express');
const router = express.Router();
const autenticarToken = require('../middleware/auth');
const Cart = require('../models/Cart');
const Address = require('../models/Address');
const PaymentMethod = require('../models/PaymentMethod');

const Order = require('../models/Order'); // Crie esse model depois, caso ainda não tenha

// GET - obter carrinho do usuário
router.get('/', autenticarToken, async (req, res) => {
  const cart = await Cart.findOne({ userId: req.user.id });
  res.json(cart || { userId: req.user.id, items: [] });
});

// POST - adicionar item ao carrinho
router.post('/', autenticarToken, async (req, res) => {
  const { companyId, productId, name, price, quantity, observation, addOns } = req.body;

  if (!companyId || !productId || !name || !price || !quantity) {
    return res.status(400).json({ error: 'Campos obrigatórios faltando.' });
  }

  let cart = await Cart.findOne({ userId: req.user.id });

  if (cart && cart.companyId !== companyId) {
    return res.status(400).json({ error: 'Você só pode ter itens de um restaurante por vez no carrinho.' });
  }

  const newItem = {
    id: Date.now().toString(),
    productId,
    name,
    price,
    quantity,
    observation: observation || '',
    addOns: addOns || []
  };

  if (!cart) {
    cart = new Cart({
      userId: req.user.id,
      companyId,
      items: [newItem]
    });
  } else {
    cart.items.push(newItem);
  }

  await cart.save();
  res.status(201).json(cart);
});

// PATCH - atualizar item do carrinho
router.patch('/:itemId', autenticarToken, async (req, res) => {
  const cart = await Cart.findOne({ userId: req.user.id });
  if (!cart) return res.status(404).json({ error: 'Carrinho não encontrado.' });

  const index = cart.items.findIndex(i => i.id === req.params.itemId);
  if (index === -1) return res.status(404).json({ error: 'Item não encontrado.' });

  cart.items[index] = { ...cart.items[index], ...req.body };

  await cart.save();
  res.json(cart.items[index]);
});

// DELETE - remover item
router.delete('/:itemId', autenticarToken, async (req, res) => {
  const cart = await Cart.findOne({ userId: req.user.id });
  if (!cart) return res.status(404).json({ error: 'Carrinho não encontrado.' });

  const index = cart.items.findIndex(i => i.id === req.params.itemId);
  if (index === -1) return res.status(404).json({ error: 'Item não encontrado.' });

  const removed = cart.items.splice(index, 1);
  await cart.save();

  res.json({ message: 'Item removido com sucesso.', item: removed[0] });
});

// DELETE - esvaziar carrinho
router.delete('/', autenticarToken, async (req, res) => {
  await Cart.deleteOne({ userId: req.user.id });
  res.json({ message: 'Carrinho esvaziado.' });
});

// POST - finalizar pedido com base no carrinho
router.post('/checkout', autenticarToken, async (req, res) => {
  const { addressId, paymentMethodId } = req.body;

  const cart = await Cart.findOne({ userId: req.user.id });
  if (!cart || cart.items.length === 0) {
    return res.status(400).json({ error: 'Carrinho vazio.' });
  }

  const endereco = await Address.findOne({ _id: addressId, userId: req.user.id });
  if (!endereco) return res.status(400).json({ error: 'Endereço inválido.' });

  const pagamento = await PaymentMethod.findOne({ _id: paymentMethodId, userId: req.user.id });
  if (!pagamento) return res.status(400).json({ error: 'Método de pagamento inválido.' });

  const total = cart.items.reduce((acc, item) => {
    const adicionais = item.addOns?.reduce((s, a) => s + a.price, 0) || 0;
    return acc + (item.price * item.quantity) + adicionais;
  }, 0);

  const pedido = new Order({
    userId: req.user.id,
    companyId: cart.companyId,
    addressId,
    paymentMethodId,
    items: cart.items,
    total: parseFloat(total.toFixed(2)),
    status: 'pendente',
    createdAt: new Date().toISOString()
  });

  await pedido.save();
  await Cart.deleteOne({ userId: req.user.id });

  res.status(201).json({ message: 'Pedido criado com sucesso!', pedido });
});

module.exports = router;
