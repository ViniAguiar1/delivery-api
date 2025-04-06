const express = require('express');
const fs = require('fs');
const path = require('path');
const autenticarToken = require('../middleware/auth');

const router = express.Router();
const dataPath = path.join(__dirname, '../db/data.json');

function readData() {
  return JSON.parse(fs.readFileSync(dataPath));
}

function writeData(data) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

// GET - obter carrinho do usuário
router.get('/', autenticarToken, (req, res) => {
  const data = readData();
  const cart = (data.carts || []).find(c => c.userId === req.user.id);
  res.json(cart || { userId: req.user.id, items: [] });
});

// POST - adicionar item ao carrinho
router.post('/', autenticarToken, (req, res) => {
  const data = readData();
  data.carts = data.carts || [];

  const { companyId, productId, name, price, quantity, observation, addOns } = req.body;

  if (!companyId || !productId || !name || !price || !quantity) {
    return res.status(400).json({ error: 'Campos obrigatórios faltando.' });
  }

  // Verifica se o usuário já tem carrinho
  let cart = data.carts.find(c => c.userId === req.user.id);

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
    cart = {
      id: Date.now().toString(),
      userId: req.user.id,
      companyId,
      items: [newItem],
      createdAt: new Date().toISOString()
    };
    data.carts.push(cart);
  } else {
    cart.items.push(newItem);
  }

  writeData(data);
  res.status(201).json(cart);
});

// PATCH - editar carrinho (ex: atualizar quantidade, observação de item)
router.patch('/:itemId', autenticarToken, (req, res) => {
  const data = readData();
  const cart = data.carts.find(c => c.userId === req.user.id);
  if (!cart) return res.status(404).json({ error: 'Carrinho não encontrado.' });

  const itemIndex = cart.items.findIndex(i => i.id === req.params.itemId);
  if (itemIndex === -1) return res.status(404).json({ error: 'Item não encontrado.' });

  cart.items[itemIndex] = { ...cart.items[itemIndex], ...req.body };
  writeData(data);
  res.json(cart.items[itemIndex]);
});

// DELETE - remover item do carrinho
router.delete('/:itemId', autenticarToken, (req, res) => {
  const data = readData();
  const cart = data.carts.find(c => c.userId === req.user.id);
  if (!cart) return res.status(404).json({ error: 'Carrinho não encontrado.' });

  const index = cart.items.findIndex(i => i.id === req.params.itemId);
  if (index === -1) return res.status(404).json({ error: 'Item não encontrado.' });

  const removed = cart.items.splice(index, 1);
  writeData(data);
  res.json({ message: 'Item removido com sucesso.', item: removed[0] });
});

// DELETE - esvaziar carrinho
router.delete('/', autenticarToken, (req, res) => {
  const data = readData();
  data.carts = (data.carts || []).filter(c => c.userId !== req.user.id);
  writeData(data);
  res.json({ message: 'Carrinho esvaziado.' });
});

// POST - finalizar pedido com base no carrinho
router.post('/checkout', autenticarToken, (req, res) => {
  const data = readData();

  const cart = (data.carts || []).find(c => c.userId === req.user.id);
  if (!cart || cart.items.length === 0) {
    return res.status(400).json({ error: 'Carrinho vazio.' });
  }

  const { addressId, paymentMethodId } = req.body;

  if (!addressId || !paymentMethodId) {
    return res.status(400).json({ error: 'Informe endereço e meio de pagamento.' });
  }

  // valida endereço do usuário
  const endereco = (data.addresses || []).find(a => a.id === addressId && a.userId === req.user.id);
  if (!endereco) {
    return res.status(400).json({ error: 'Endereço inválido.' });
  }

  // valida cartão do usuário
  const pagamento = (data.paymentMethods || []).find(p => p.id === paymentMethodId && p.userId === req.user.id);
  if (!pagamento) {
    return res.status(400).json({ error: 'Método de pagamento inválido.' });
  }

  // calcular total
  const total = cart.items.reduce((acc, item) => {
    const adicionais = item.addOns?.reduce((s, a) => s + a.price, 0) || 0;
    return acc + (item.price * item.quantity) + adicionais;
  }, 0);

  // criar pedido
  const novoPedido = {
    id: Date.now().toString(),
    userId: req.user.id,
    companyId: cart.companyId,
    addressId,
    paymentMethodId,
    items: cart.items,
    total: parseFloat(total.toFixed(2)),
    status: 'pendente',
    createdAt: new Date().toISOString()
  };

  data.orders = data.orders || [];
  data.orders.push(novoPedido);

  // limpar carrinho
  data.carts = data.carts.filter(c => c.userId !== req.user.id);

  writeData(data);
  res.status(201).json({ message: 'Pedido criado com sucesso!', pedido: novoPedido });
});


module.exports = router;
