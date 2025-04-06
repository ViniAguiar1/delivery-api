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

// GET - buscar configurações do usuário
router.get('/', autenticarToken, (req, res) => {
  const data = readData();
  const config = (data.notificationSettings || []).find(c => c.userId === req.user.id);
  res.json(config || getDefaultSettings(req.user.id));
});

// POST - atualizar configurações
router.patch('/', autenticarToken, (req, res) => {
  const data = readData();
  data.notificationSettings = data.notificationSettings || [];

  const index = data.notificationSettings.findIndex(c => c.userId === req.user.id);

  const updated = {
    userId: req.user.id,
    ...getDefaultSettings(req.user.id), // estrutura base
    ...req.body                        // sobrescreve com o que foi enviado
  };

  if (index >= 0) {
    data.notificationSettings[index] = updated;
  } else {
    data.notificationSettings.push(updated);
  }

  writeData(data);
  res.json({ message: 'Preferências de notificação atualizadas.', config: updated });
});

// POST - restaurar configurações padrão
router.post('/reset', autenticarToken, (req, res) => {
  const data = readData();
  data.notificationSettings = data.notificationSettings || [];

  const defaultConfig = getDefaultSettings(req.user.id);
  const index = data.notificationSettings.findIndex(c => c.userId === req.user.id);

  if (index >= 0) {
    data.notificationSettings[index] = defaultConfig;
  } else {
    data.notificationSettings.push(defaultConfig);
  }

  writeData(data);
  res.json({ message: 'Configurações restauradas com sucesso.', config: defaultConfig });
});

module.exports = router;
