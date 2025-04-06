const express = require('express');
const Notification = require('../models/Notification');  // Importando a model Notification
const User = require('../models/User');  // Importando a model User
const NotificationSettings = require('../models/NotificationSettings');  // Importando a model NotificationSettings
const autenticarToken = require('../middleware/auth');

const router = express.Router();

// GET - listar notificações do usuário logado
router.get('/', autenticarToken, async (req, res) => {
  const { type } = req.query;

  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .where(type ? { type } : {})  // Filtro opcional por tipo
      .sort({ createdAt: -1 });  // Ordena as notificações pela data

    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar notificações.' });
  }
});

// POST - criar notificação (global ou individual) respeitando preferências
router.post('/', autenticarToken, async (req, res) => {
  if (req.user.tipo !== 'desenvolvimento') {
    return res.status(403).json({ error: 'Apenas usuários do tipo desenvolvimento podem criar notificações manuais.' });
  }

  const { title, message, type, userId } = req.body;

  if (!title || !message || !type) {
    return res.status(400).json({ error: 'Campos obrigatórios: title, message, type.' });
  }

  const tiposPermitidos = ['pedido', 'marketing', 'sistema'];
  if (!tiposPermitidos.includes(type)) {
    return res.status(400).json({ error: 'Tipo de notificação inválido.' });
  }

  try {
    // Se for notificação direcionada, verificar preferências
    if (userId) {
      const settings = await NotificationSettings.findOne({ userId });
      const preferencia = settings || {
        pedidos: { atualizacaoPedido: true },
        marketing: { promocoes: true },
        sistema: { atualizacoesApp: true }
      };

      const tipoPermitido = {
        pedido: true,
        marketing: preferencia.marketing?.promocoes || false,
        sistema: preferencia.sistema?.atualizacoesApp || false
      };

      if (!tipoPermitido[type]) {
        return res.status(403).json({ error: `Usuário não permite notificações do tipo "${type}".` });
      }
    }

    const novaNotificacao = new Notification({
      userId: userId || null,
      title,
      message,
      type,
      read: false
    });

    await novaNotificacao.save();
    res.status(201).json({ message: 'Notificação criada com sucesso.', notification: novaNotificacao });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar notificação.' });
  }
});

// PATCH - marcar notificação como lida
router.patch('/:id/read', autenticarToken, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification || (notification.userId !== req.user.id && notification.userId !== null)) {
      return res.status(404).json({ error: 'Notificação não encontrada.' });
    }

    notification.read = true;
    await notification.save();

    res.json({ message: 'Notificação marcada como lida.' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao marcar notificação como lida.' });
  }
});

// DELETE - remover notificação
router.delete('/:id', autenticarToken, async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);

    if (!notification) {
      return res.status(404).json({ error: 'Notificação não encontrada.' });
    }

    res.json({ message: 'Notificação removida.', notificação: notification });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao remover notificação.' });
  }
});

// POST - criar notificação para todos os usuários que permitirem (respeitando preferências)
router.post('/broadcast', autenticarToken, async (req, res) => {
  if (req.user.tipo !== 'desenvolvimento') {
    return res.status(403).json({ error: 'Apenas desenvolvedores podem enviar notificações em massa.' });
  }

  const { title, message, type } = req.body;

  if (!title || !message || !type) {
    return res.status(400).json({ error: 'Campos obrigatórios: title, message, type.' });
  }

  const tiposPermitidos = ['pedido', 'marketing', 'sistema'];
  if (!tiposPermitidos.includes(type)) {
    return res.status(400).json({ error: 'Tipo de notificação inválido.' });
  }

  try {
    const users = await User.find({});
    const notificationsCriadas = [];

    for (let user of users) {
      const settings = await NotificationSettings.findOne({ userId: user.id });
      const preferencia = settings || {
        pedidos: { atualizacaoPedido: true },
        marketing: { promocoes: true },
        sistema: { atualizacoesApp: true }
      };

      const tipoPermitido = {
        pedido: true,
        marketing: preferencia.marketing?.promocoes || false,
        sistema: preferencia.sistema?.atualizacoesApp || false
      };

      if (tipoPermitido[type]) {
        const newNotification = new Notification({
          userId: user.id,
          title,
          message,
          type,
          read: false
        });

        await newNotification.save();
        notificationsCriadas.push(newNotification);
      }
    }

    res.status(201).json({
      message: `Notificação enviada para ${notificationsCriadas.length} usuários.`,
      notificacoes: notificationsCriadas.map(n => ({ id: n.id, userId: n.userId }))
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao enviar notificações em massa.' });
  }
});

module.exports = router;
