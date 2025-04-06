const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Definindo o esquema para as configurações de notificações
const notificationSettingsSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',  // Referência ao modelo de usuário
    required: true
  },
  pedidos: {
    atualizacaoPedido: {
      type: Boolean,
      default: true
    },
    statusEntrega: {
      type: Boolean,
      default: true
    },
    alertaEntrega: {
      type: Boolean,
      default: true
    }
  },
  marketing: {
    promocoes: {
      type: Boolean,
      default: true
    },
    ofertasEspeciais: {
      type: Boolean,
      default: true
    }
  },
  sistema: {
    atualizacoesApp: {
      type: Boolean,
      default: true
    }
  },
  preferencias: {
    som: {
      type: Boolean,
      default: true
    },
    vibracao: {
      type: Boolean,
      default: true
    }
  }
}, { timestamps: true }); // Para registrar a data de criação e atualização

module.exports = mongoose.model('NotificationSettings', notificationSettingsSchema);
