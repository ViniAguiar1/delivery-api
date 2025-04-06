const express = require('express');
const NotificationSettings = require('../models/NotificationSettings');  // Importando a model NotificationSettings
const autenticarToken = require('../middleware/auth');

const router = express.Router();

// Função para gerar configurações padrão para novos usuários
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

// GET - buscar configurações do usuário
router.get('/', autenticarToken, async (req, res) => {
  try {
    let config = await NotificationSettings.findOne({ userId: req.user.id });

    if (!config) {
      // Se não houver configurações, retorna as configurações padrão
      config = getDefaultSettings(req.user.id);
      res.json(config);
    } else {
      res.json(config);
    }
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar configurações de notificações.' });
  }
});

// POST - atualizar configurações
router.patch('/', autenticarToken, async (req, res) => {
  try {
    let updatedConfig = await NotificationSettings.findOneAndUpdate(
      { userId: req.user.id }, // Encontrar configuração pela ID do usuário
      { $set: req.body },  // Atualizar com os dados enviados
      { new: true, upsert: true } // Se não existir, cria uma nova configuração
    );

    res.json({
      message: 'Preferências de notificação atualizadas.',
      config: updatedConfig
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar as configurações.' });
  }
});

// POST - restaurar configurações padrão
router.post('/reset', autenticarToken, async (req, res) => {
  try {
    const defaultConfig = getDefaultSettings(req.user.id);

    let updatedConfig = await NotificationSettings.findOneAndUpdate(
      { userId: req.user.id },
      { $set: defaultConfig },
      { new: true, upsert: true }
    );

    res.json({
      message: 'Configurações restauradas com sucesso.',
      config: updatedConfig
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao restaurar configurações padrão.' });
  }
});

module.exports = router;
