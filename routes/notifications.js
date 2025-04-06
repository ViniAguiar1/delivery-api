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

// GET - listar notificações do usuário logado
// GET - listar notificações do usuário logado (com filtro opcional por tipo)
router.get('/', autenticarToken, (req, res) => {
  const { type } = req.query;
  const data = readData();
  const todas = data.notifications || [];

  const minhas = todas.filter(n =>
    (!n.userId || n.userId === req.user.id) &&
    (!type || n.type === type)
  );

  res.json(minhas.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

// POST - criar notificação (global ou individual) respeitando preferências
router.post('/', autenticarToken, (req, res) => {
  if (req.user.tipo !== 'desenvolvimento') {
    return res.status(403).json({ error: 'Apenas usuários do tipo desenvolvimento podem criar notificações manuais.' });
  }

  const data = readData();
  const { title, message, type, userId } = req.body;

  if (!title || !message || !type) {
    return res.status(400).json({ error: 'Campos obrigatórios: title, message, type.' });
  }

  const tiposPermitidos = ['pedido', 'marketing', 'sistema'];
  if (!tiposPermitidos.includes(type)) {
    return res.status(400).json({ error: 'Tipo de notificação inválido.' });
  }

  // Se for notificação direcionada, verificar preferências
  if (userId) {
    const settings = (data.notificationSettings || []).find(s => s.userId === userId);
    const preferencia = settings || getDefaultSettings(userId);

    const tipoPermitido = {
      pedido: true,
      marketing: preferencia.marketing?.promocoes || false,
      sistema: preferencia.sistema?.atualizacoesApp || false
    };

    if (!tipoPermitido[type]) {
      return res.status(403).json({ error: `Usuário não permite notificações do tipo "${type}".` });
    }
  }

  const nova = {
    id: Date.now().toString(),
    userId: userId || null,
    title,
    message,
    type,
    read: false,
    createdAt: new Date().toISOString()
  };

  data.notifications = data.notifications || [];
  data.notifications.push(nova);
  writeData(data);

  res.status(201).json({ message: 'Notificação criada com sucesso.', notification: nova });
});

// PATCH - marcar como lida
router.patch('/:id/read', autenticarToken, (req, res) => {
  const data = readData();
  const notifications = data.notifications || [];

  const index = notifications.findIndex(n => n.id === req.params.id && (n.userId === req.user.id || n.userId === null));
  if (index === -1) return res.status(404).json({ error: 'Notificação não encontrada.' });

  notifications[index].read = true;
  data.notifications = notifications;
  writeData(data);

  res.json({ message: 'Notificação marcada como lida.' });
});

// DELETE - remover notificação
router.delete('/:id', autenticarToken, (req, res) => {
  const data = readData();
  const notifications = data.notifications || [];

  const index = notifications.findIndex(n => n.id === req.params.id && n.userId === req.user.id);
  if (index === -1) return res.status(404).json({ error: 'Notificação não encontrada.' });

  const removed = notifications.splice(index, 1);
  data.notifications = notifications;
  writeData(data);

  res.json({ message: 'Notificação removida.', notificação: removed[0] });
});

// POST - criar notificação para todos os usuários que permitirem (respeitando preferências)
router.post('/broadcast', autenticarToken, (req, res) => {
  if (req.user.tipo !== 'desenvolvimento') {
    return res.status(403).json({ error: 'Apenas desenvolvedores podem enviar notificações em massa.' });
  }

  const data = readData();
  const { title, message, type } = req.body;

  if (!title || !message || !type) {
    return res.status(400).json({ error: 'Campos obrigatórios: title, message, type.' });
  }

  const tiposPermitidos = ['pedido', 'marketing', 'sistema'];
  if (!tiposPermitidos.includes(type)) {
    return res.status(400).json({ error: 'Tipo de notificação inválido.' });
  }

  const users = data.users || [];
  const settingsList = data.notificationSettings || [];
  const notificationsCriadas = [];

  users.forEach(user => {
    const settings = settingsList.find(s => s.userId === user.id);
    const preferencia = settings || getDefaultSettings(user.id);

    const tipoPermitido = {
      pedido: true,
      marketing: preferencia.marketing?.promocoes || false,
      sistema: preferencia.sistema?.atualizacoesApp || false
    };

    if (tipoPermitido[type]) {
      const noti = {
        id: Date.now().toString() + user.id, // ID único por usuário
        userId: user.id,
        title,
        message,
        type,
        read: false,
        createdAt: new Date().toISOString()
      };

      notificationsCriadas.push(noti);
    }
  });

  data.notifications = data.notifications || [];
  data.notifications.push(...notificationsCriadas);
  writeData(data);

  res.status(201).json({
    message: `Notificação enviada para ${notificationsCriadas.length} usuários.`,
    type,
    notificacoes: notificationsCriadas.map(n => ({ id: n.id, userId: n.userId }))
  });
});

module.exports = router;
