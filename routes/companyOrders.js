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

function validarEmpresa(req, res, next) {
  if (req.user.tipo !== 'empresa') {
    return res.status(403).json({ error: 'Acesso permitido apenas para empresas.' });
  }
  next();
}

function getDefaultSettings(userId) {
  return {
    userId,
    pedidos: {
      atualizacaoPedido: true,
      statusEntrega: true,
      alertaEntrega: true
    },
    marketing: {
      promocoes: true,
      ofertasEspeciais: true
    },
    sistema: {
      atualizacoesApp: true
    },
    preferencias: {
      som: true,
      vibracao: true
    }
  };
}

// GET - listar pedidos da empresa (com média de avaliação do usuário)
router.get('/', autenticarToken, validarEmpresa, (req, res) => {
  const data = readData();
  const pedidos = (data.orders || []).filter(o => o.companyId === req.user.id);
  const users = data.users || [];

  const pedidosComInfo = pedidos.map(pedido => {
    const user = users.find(u => u.id === pedido.userId);
    const mediaAvaliacoes = user?.mediaAvaliacoes ?? null;
    const nomeCliente = user?.nome || 'Usuário';

    return {
      ...pedido,
      nomeCliente,
      mediaAvaliacoes
    };
  });

  res.json(pedidosComInfo);
});

// PATCH - atualizar status do pedido (com notificação e atualização de estoque)
router.patch('/:id/status', autenticarToken, validarEmpresa, (req, res) => {
  const data = readData();
  const pedidos = data.orders || [];
  const pedido = pedidos.find(p => p.id === req.params.id && p.companyId === req.user.id);

  if (!pedido) return res.status(404).json({ error: 'Pedido não encontrado.' });

  const { status } = req.body;
  const statusValidos = ['pendente', 'aceito', 'em preparo', 'saiu para entrega', 'entregue', 'cancelado'];

  if (!statusValidos.includes(status)) {
    return res.status(400).json({ error: 'Status inválido.' });
  }

  pedido.status = status;

  // 🔽 Reduzir estoque se for aceito
  if (status === 'aceito') {
    const produtos = data.products || [];

    pedido.items.forEach(item => {
      const produto = produtos.find(p => p.id === item.productId && p.companyId === req.user.id);
      if (produto && typeof produto.estoque === 'number') {
        produto.estoque -= item.quantity;
        if (produto.estoque < 0) produto.estoque = 0;
      }
    });

    data.products = produtos;
  }

  // Notificação automática se permitido
  const settings = (data.notificationSettings || []).find(s => s.userId === pedido.userId);
  const preferencia = settings || getDefaultSettings(pedido.userId);

  if (
    ['saiu para entrega', 'entregue', 'em preparo', 'aceito'].includes(status) &&
    preferencia.pedidos?.atualizacaoPedido
  ) {
    const mensagens = {
      'aceito': 'O restaurante aceitou seu pedido!',
      'em preparo': 'Seu pedido está sendo preparado!',
      'saiu para entrega': 'O entregador está a caminho.',
      'entregue': 'Pedido entregue! Bom apetite.'
    };

    data.notifications = data.notifications || [];
    data.notifications.push({
      id: Date.now().toString(),
      userId: pedido.userId,
      title: `Pedido ${status}`,
      message: mensagens[status],
      type: 'pedido',
      read: false,
      createdAt: new Date().toISOString()
    });
  }

  writeData(data);
  res.json({ message: 'Status atualizado com sucesso.', pedido });
});

// PATCH - atribuir pedido a um motoboy da empresa
router.patch('/:id/assign', autenticarToken, validarEmpresa, (req, res) => {
  const data = readData();
  const pedidos = data.orders || [];
  const staff = data.staff || [];

  const pedido = pedidos.find(p => p.id === req.params.id && p.companyId === req.user.id);
  if (!pedido) return res.status(404).json({ error: 'Pedido não encontrado.' });

  const { motoboyId } = req.body;
  if (!motoboyId) return res.status(400).json({ error: 'motoboyId é obrigatório.' });

  const motoboy = staff.find(f => f.id === motoboyId && f.empresaId === req.user.id && f.ativo && f.cargo === 'motoboy');
  if (!motoboy) return res.status(404).json({ error: 'Motoboy não encontrado ou inativo.' });

  pedido.motoboyId = motoboyId;

  writeData(data);
  res.json({ message: 'Pedido atribuído ao motoboy com sucesso.', pedido });
});

// GET - listar motoboys ativos da empresa logada
router.get('/:id/available-motoboys', autenticarToken, validarEmpresa, (req, res) => {
  const data = readData();
  const staff = data.staff || [];

  const motoboys = staff.filter(f => f.empresaId === req.user.id && f.ativo && f.cargo === 'motoboy');

  res.json(motoboys);
});

module.exports = router;
